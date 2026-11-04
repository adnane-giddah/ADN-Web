// Review storage. Upstash Redis (REST) in production, a JSON file on your own
// machine or server. Vercel's filesystem is read-only, so on Vercel without
// Redis there is no store at all and the API reports that honestly.
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const REVIEWS_KEY = 'adn:reviews';
const REDIS_TIMEOUT_MS = 5000;

export function createStore(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisStore(url.replace(/\/+$/, ''), token);
  if (env.VERCEL) return null;
  return fileStore(env.DATA_DIR || DEFAULT_DATA_DIR);
}

const newest = (a, b) => b.createdAt.localeCompare(a.createdAt);

function makeReview(fields) {
  return { id: randomUUID(), createdAt: new Date().toISOString(), status: 'pending', ...fields };
}

function redisStore(url, token) {
  async function post(target, body) {
    const res = await fetch(target, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Redis responded ${res.status}`);
    return res.json();
  }

  async function command(...args) {
    const { result, error } = await post(url, args);
    if (error) throw new Error(`Redis error: ${error}`);
    return result;
  }

  async function read(id) {
    const raw = await command('HGET', REVIEWS_KEY, id);
    return raw ? JSON.parse(raw) : null;
  }

  return {
    kind: 'redis',

    async list() {
      const flat = (await command('HGETALL', REVIEWS_KEY)) || [];
      const reviews = [];
      for (let i = 1; i < flat.length; i += 2) reviews.push(JSON.parse(flat[i]));
      return reviews.sort(newest);
    },

    async add(fields) {
      const review = makeReview(fields);
      await command('HSET', REVIEWS_KEY, review.id, JSON.stringify(review));
      return review;
    },

    async update(id, patch) {
      const review = await read(id);
      if (!review) return null;
      const next = { ...review, ...patch };
      await command('HSET', REVIEWS_KEY, id, JSON.stringify(next));
      return next;
    },

    async remove(id) {
      return (await command('HDEL', REVIEWS_KEY, id)) > 0;
    },

    async count(key) {
      return Number(await command('GET', `adn:limit:${key}`)) || 0;
    },

    // SET NX starts the window once; INCR keeps its expiry.
    async hit(key, windowMs) {
      const name = `adn:limit:${key}`;
      const replies = await post(`${url}/pipeline`, [
        ['SET', name, 0, 'PX', windowMs, 'NX'],
        ['INCR', name],
      ]);
      const failed = replies.find((r) => r.error);
      if (failed) throw new Error(`Redis error: ${failed.error}`);
    },
  };
}

function fileStore(dir) {
  const file = path.join(dir, 'reviews.json');
  const limits = new Map(); // key -> { count, resetAt }
  let queue = Promise.resolve();

  async function load() {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  // Writes run one at a time and swap the file in whole, so two requests can't
  // lose each other's review and a crash can't leave half a file.
  function change(fn) {
    const run = queue.then(async () => {
      const list = await load();
      const { next, result } = fn(list);
      if (next) {
        await fs.mkdir(dir, { recursive: true });
        const temp = `${file}.${randomUUID()}.tmp`;
        await fs.writeFile(temp, JSON.stringify(next, null, 2));
        await fs.rename(temp, file);
      }
      return result;
    });
    queue = run.catch(() => {});
    return run;
  }

  function current(key) {
    const entry = limits.get(key);
    if (entry && entry.resetAt <= Date.now()) {
      limits.delete(key);
      return undefined;
    }
    return entry;
  }

  return {
    kind: 'file',

    async list() {
      await queue;
      return (await load()).sort(newest);
    },

    add(fields) {
      const review = makeReview(fields);
      return change((list) => ({ next: [review, ...list], result: review }));
    },

    update(id, patch) {
      return change((list) => {
        const review = list.find((r) => r.id === id);
        if (!review) return { result: null };
        const updated = { ...review, ...patch };
        return { next: list.map((r) => (r.id === id ? updated : r)), result: updated };
      });
    },

    remove(id) {
      return change((list) => {
        const next = list.filter((r) => r.id !== id);
        return next.length === list.length ? { result: false } : { next, result: true };
      });
    },

    async count(key) {
      return current(key)?.count || 0;
    },

    async hit(key, windowMs) {
      const entry = current(key);
      if (entry) entry.count += 1;
      else limits.set(key, { count: 1, resetAt: Date.now() + windowMs });
    },
  };
}
