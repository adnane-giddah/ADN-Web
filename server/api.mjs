// The review API, shared by the Node server (server/index.mjs) and the Vercel
// function (api/index.mjs).
//   GET    /api/health                   what storage is connected
//   GET    /api/reviews                  published reviews and the average rating
//   POST   /api/reviews                  public, rate limited, held for approval
//   GET    /api/manager/reviews          every review (x-admin-token header)
//   PATCH  /api/manager/reviews/:id      { status: 'pending' | 'approved' }
//   DELETE /api/manager/reviews/:id
import { createHash, timingSafeEqual } from 'node:crypto';
import { createStore } from './store.mjs';

const MAX_FAILS = 5; // wrong passwords allowed per IP...
const FAIL_WINDOW_MS = 15 * 60 * 1000; // ...per 15 minutes
const MAX_PER_WINDOW = 3; // reviews allowed per IP...
const WINDOW_MS = 60 * 60 * 1000; // ...per hour
const MAX_NAME = 60;
const MIN_TEXT = 3;
const MAX_TEXT = 1000;
const MAX_BODY = 10_000;
const MAX_PUBLIC = 24;
const STATUSES = ['pending', 'approved'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) {
    return Promise.reject(new HttpError(415, 'Send JSON.'));
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    let tooLarge = false;
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      if (raw.length + chunk.length > MAX_BODY) tooLarge = true;
      else raw += chunk;
    });
    req.on('error', reject);
    req.on('end', () => {
      if (tooLarge) return reject(new HttpError(413, 'That is too long.'));
      try {
        const body = JSON.parse(raw);
        if (body && typeof body === 'object' && !Array.isArray(body)) return resolve(body);
      } catch {
        // falls through to the same error
      }
      reject(new HttpError(400, 'Could not read that request.'));
    });
  });
}

// Keeps line breaks in the review, drops every other control character.
const clean = (value) => String(value ?? '').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim();

const publicView = ({ id, name, rating, text, createdAt }) => ({ id, name, rating, text, createdAt });

const sha256 = (value) => createHash('sha256').update(String(value)).digest();

export function createApi(env = process.env) {
  const store = createStore(env);
  const adminToken = env.ADMIN_TOKEN || '';
  const trustProxy = env.TRUST_PROXY === 'true';

  if (!store) console.warn('No review storage: connect Upstash Redis to accept reviews.');

  function requireStore() {
    if (!store) throw new HttpError(503, 'Reviews are not available right now.');
    return store;
  }

  function clientIp(req) {
    if (env.VERCEL) {
      const ip = req.headers['x-real-ip'] || req.headers['x-vercel-forwarded-for'];
      if (ip) return String(ip).split(',')[0].trim();
    }
    if (trustProxy) {
      // Your proxy appends the address it saw, so only the last entry can be
      // trusted. Anything before it could have been typed by the client.
      const forwarded = String(req.headers['x-forwarded-for'] || '').split(',');
      const ip = forwarded[forwarded.length - 1].trim();
      if (ip) return ip;
    }
    return req.socket.remoteAddress || 'unknown';
  }

  // Limit keys hold a hash, so no visitor IPs end up in the database.
  const limitKey = (scope, req) => `${scope}:${sha256(clientIp(req)).toString('hex').slice(0, 32)}`;

  async function requireManager(req) {
    const active = requireStore();
    if (!adminToken) throw new HttpError(401, 'Unauthorized');
    const key = limitKey('login', req);
    if ((await active.count(key)) >= MAX_FAILS) {
      throw new HttpError(429, 'Too many wrong passwords. Try again in 15 minutes.');
    }
    // Hashing first means the comparison can't leak the password's length.
    if (!timingSafeEqual(sha256(req.headers['x-admin-token'] || ''), sha256(adminToken))) {
      await active.hit(key, FAIL_WINDOW_MS);
      throw new HttpError(401, 'Unauthorized');
    }
    return active;
  }

  async function publishedReviews(res) {
    if (!store) return send(res, 200, { accepting: false, count: 0, average: null, reviews: [] });
    const approved = (await store.list()).filter((r) => r.status === 'approved');
    const total = approved.reduce((sum, r) => sum + r.rating, 0);
    return send(res, 200, {
      accepting: true,
      count: approved.length,
      average: approved.length ? Math.round((total / approved.length) * 10) / 10 : null,
      reviews: approved.slice(0, MAX_PUBLIC).map(publicView),
    });
  }

  async function submitReview(req, res) {
    const active = requireStore();
    const key = limitKey('review', req);
    if ((await active.count(key)) >= MAX_PER_WINDOW) {
      throw new HttpError(429, 'Too many reviews. Please try again later.');
    }
    const body = await readJson(req);
    if (body.website) return send(res, 201, { ok: true }); // honeypot: pretend success
    const name = clean(body.name).slice(0, MAX_NAME) || 'Anonymous';
    const text = clean(body.text);
    if (text.length < MIN_TEXT || text.length > MAX_TEXT) {
      throw new HttpError(400, `Your review must be ${MIN_TEXT} to ${MAX_TEXT} characters.`);
    }
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      throw new HttpError(400, 'Please pick a rating from 1 to 5 stars.');
    }
    await active.add({ name, rating: body.rating, text });
    await active.hit(key, WINDOW_MS);
    return send(res, 201, { ok: true });
  }

  async function route(req, res, pathname) {
    const method = req.method;

    if (pathname === '/api/health') {
      if (method !== 'GET') throw new HttpError(405, 'Method not allowed.');
      return send(res, 200, { ok: true, storage: store ? store.kind : 'none' });
    }

    if (pathname === '/api/reviews') {
      if (method === 'GET') return publishedReviews(res);
      if (method === 'POST') return submitReview(req, res);
      throw new HttpError(405, 'Method not allowed.');
    }

    if (pathname === '/api/manager/reviews') {
      if (method !== 'GET') throw new HttpError(405, 'Method not allowed.');
      const active = await requireManager(req);
      return send(res, 200, await active.list());
    }

    const match = pathname.match(/^\/api\/manager\/reviews\/([\w-]+)$/);
    if (match) {
      const [, id] = match;
      if (method === 'PATCH') {
        const active = await requireManager(req);
        const { status } = await readJson(req);
        if (!STATUSES.includes(status)) throw new HttpError(400, 'Unknown status.');
        const updated = await active.update(id, { status });
        if (!updated) throw new HttpError(404, 'That review no longer exists.');
        return send(res, 200, updated);
      }
      if (method === 'DELETE') {
        const active = await requireManager(req);
        if (!(await active.remove(id))) throw new HttpError(404, 'That review no longer exists.');
        return send(res, 200, { ok: true });
      }
      throw new HttpError(405, 'Method not allowed.');
    }

    throw new HttpError(404, 'Not found.');
  }

  // Resolves to false when the request isn't for the API.
  return async function handleApi(req, res) {
    const { pathname } = new URL(req.url, 'http://x');
    if (pathname !== '/api' && !pathname.startsWith('/api/')) return false;
    try {
      await route(req, res, pathname);
    } catch (error) {
      if (error instanceof HttpError) {
        send(res, error.status, { error: error.message });
      } else {
        // Details stay in the logs: storage errors shouldn't reach visitors.
        console.error('API error:', error);
        send(res, 503, { error: 'Something went wrong on our side. Please try again soon.' });
      }
    }
    return true;
  };
}
