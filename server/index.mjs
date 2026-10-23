// Tiny dependency-free review API.
//   POST /api/reviews                 public, rate limited
//   <ADMIN_PATH>/                     private manager page (separate bundle)
//   GET  <ADMIN_PATH>/api/reviews     manager only (x-admin-token header)
//   DELETE <ADMIN_PATH>/api/reviews/:id
// The secret path exists only here on the server, never in the public bundle.
// Serves ./dist (public site) and ./dist-admin (only under ADMIN_PATH).
import http from 'node:http';
import { promises as fs, existsSync } from 'node:fs';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './loadEnv.mjs';

loadEnv();

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reviews.json');
const DIST = path.join(ROOT, '..', 'dist');
const DIST_ADMIN = path.join(ROOT, '..', 'dist-admin');

const PORT = Number(process.env.PORT || 3001);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ADMIN_PATH = process.env.ADMIN_PATH
  ? '/' + process.env.ADMIN_PATH.replace(/^\/+|\/+$/g, '')
  : '';
const MAX_FAILS = 5; // wrong passwords allowed per IP...
const FAIL_WINDOW_MS = 15 * 60 * 1000; // ...per 15 minutes
const MAX_PER_WINDOW = 3; // reviews allowed per IP...
const WINDOW_MS = 60 * 60 * 1000; // ...per hour
const MAX_NAME = 60;
const MAX_TEXT = 1000;

if (!ADMIN_TOKEN) {
  console.warn('ADMIN_TOKEN is not set: the manager view is disabled.');
}

const fails = new Map(); // ip -> timestamps of wrong passwords
const hits = new Map(); // ip -> timestamps of recent submissions

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.set(ip, recent);
  return recent.length >= MAX_PER_WINDOW;
}

async function load() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function save(list) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2));
}

function locked(ip) {
  const now = Date.now();
  const recent = (fails.get(ip) || []).filter((t) => now - t < FAIL_WINDOW_MS);
  fails.set(ip, recent);
  return recent.length >= MAX_FAILS;
}

// Returns true if the request is the manager. Records failures per IP.
function isAdmin(req) {
  const ip = req.socket.remoteAddress || 'unknown';
  if (locked(ip)) return false;
  const ok = checkToken(req);
  if (!ok) fails.get(ip).push(Date.now());
  return ok;
}

function checkToken(req) {
  const given = Buffer.from(String(req.headers['x-admin-token'] || ''));
  const real = Buffer.from(ADMIN_TOKEN);
  return ADMIN_TOKEN && given.length === real.length && timingSafeEqual(given, real);
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 10_000) {
        reject(new Error('too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(new Error('bad json'));
      }
    });
  });
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
};

async function serveStatic(res, dir, rel, headers = {}) {
  let file = path.join(dir, path.normalize(rel));
  if (!file.startsWith(dir)) return send(res, 403, { error: 'forbidden' });
  if (!existsSync(file) || (await fs.stat(file)).isDirectory()) {
    file = path.join(dir, 'index.html');
  }
  if (!existsSync(file)) return send(res, 404, { error: 'not found' });
  res.writeHead(200, {
    'content-type': MIME[path.extname(file)] || 'application/octet-stream',
    ...headers,
  });
  res.end(await fs.readFile(file));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');

    if (url.pathname === '/api/reviews' && req.method === 'POST') {
      const ip = req.socket.remoteAddress || 'unknown';
      if (limited(ip)) {
        return send(res, 429, { error: 'Too many reviews. Please try again later.' });
      }
      const body = await readBody(req);
      if (body.website) return send(res, 201, { ok: true }); // honeypot: pretend success
      const name = String(body.name || '').trim().slice(0, MAX_NAME) || 'Anonymous';
      const text = String(body.text || '').trim();
      const rating = Math.round(Number(body.rating));
      if (text.length < 3 || text.length > MAX_TEXT) {
        return send(res, 400, { error: `Review must be 3-${MAX_TEXT} characters.` });
      }
      if (!(rating >= 1 && rating <= 5)) {
        return send(res, 400, { error: 'Rating must be 1-5.' });
      }
      hits.get(ip).push(Date.now());
      const list = await load();
      list.unshift({ id: randomUUID(), name, rating, text, createdAt: new Date().toISOString() });
      await save(list);
      return send(res, 201, { ok: true });
    }

    // ---- private manager area ----
    if (ADMIN_PATH && url.pathname === ADMIN_PATH) {
      res.writeHead(302, { location: ADMIN_PATH + '/' });
      return res.end();
    }
    if (ADMIN_PATH && url.pathname.startsWith(ADMIN_PATH + '/')) {
      const rel = url.pathname.slice(ADMIN_PATH.length);
      const priv = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' };

      if (rel === '/api/reviews' && req.method === 'GET') {
        if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });
        return send(res, 200, await load());
      }
      const del = rel.match(/^\/api\/reviews\/([\w-]+)$/);
      if (del && req.method === 'DELETE') {
        if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });
        await save((await load()).filter((r) => r.id !== del[1]));
        return send(res, 200, { ok: true });
      }
      if (rel.startsWith('/api/')) return send(res, 404, { error: 'not found' });
      return serveStatic(res, DIST_ADMIN, rel, priv);
    }

    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'not found' });
    return serveStatic(res, DIST, url.pathname);
  } catch (e) {
    return send(res, 400, { error: e.message || 'bad request' });
  }
});

server.listen(PORT, () => {
  const managerStatus = ADMIN_PATH ? ` (manager: ${ADMIN_PATH}/)` : '';
  console.log(`ADN server on http://localhost:${PORT}${managerStatus}`);
});
