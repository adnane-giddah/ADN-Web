// Node server for running ADN yourself: the API, the public site from ./dist,
// and the private manager page from ./dist-admin, only under ADMIN_PATH. The
// secret path exists only here on the server, never in the public bundle.
// On Vercel, api/index.mjs and scripts/publish-manager.mjs do this job instead.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './api.mjs';
import { loadEnv } from './loadEnv.mjs';

loadEnv();

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, '..', 'dist');
const DIST_ADMIN = path.join(ROOT, '..', 'dist-admin');

const PORT = Number(process.env.PORT || 3001);
const ADMIN_PATH = process.env.ADMIN_PATH
  ? '/' + process.env.ADMIN_PATH.replace(/^\/+|\/+$/g, '')
  : '';

if (!process.env.ADMIN_TOKEN) {
  console.warn('ADMIN_TOKEN is not set: the manager view is disabled.');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

async function readFileIfPresent(file) {
  try {
    return await fs.readFile(file);
  } catch (error) {
    if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) return null;
    throw error;
  }
}

function sendPlain(res, status, text) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
  res.end(text);
}

async function serveStatic(res, dir, rel, headers = {}) {
  const file = path.join(dir, rel);
  if (file !== dir && !file.startsWith(dir + path.sep)) return sendPlain(res, 403, 'Forbidden');

  let found = file;
  let body = await readFileIfPresent(file);
  // A missing page falls back to the app. A missing file stays a real 404.
  if (!body && !path.extname(rel)) {
    found = path.join(dir, 'index.html');
    body = await readFileIfPresent(found);
  }
  if (!body) return sendPlain(res, 404, 'Not found');

  const fingerprinted = rel.startsWith('/assets/');
  res.writeHead(200, {
    'content-type': MIME[path.extname(found)] || 'application/octet-stream',
    'cache-control': fingerprinted ? 'public, max-age=31536000, immutable' : 'no-cache',
    ...SECURITY_HEADERS,
    ...headers,
  });
  res.end(body);
}

const handleApi = createApi();

const server = http.createServer(async (req, res) => {
  try {
    if (await handleApi(req, res)) return;

    const { pathname } = new URL(req.url, 'http://x');
    const rel = decodeURIComponent(pathname);

    if (ADMIN_PATH && rel === ADMIN_PATH) {
      res.writeHead(302, { location: ADMIN_PATH + '/' });
      return res.end();
    }
    if (ADMIN_PATH && rel.startsWith(ADMIN_PATH + '/')) {
      const priv = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' };
      return await serveStatic(res, DIST_ADMIN, rel.slice(ADMIN_PATH.length), priv);
    }
    return await serveStatic(res, DIST, rel);
  } catch (error) {
    if (error instanceof URIError) return sendPlain(res, 400, 'Bad request');
    console.error('Server error:', error);
    if (!res.headersSent) sendPlain(res, 500, 'Server error');
    else res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const managerStatus = ADMIN_PATH ? ' (manager page enabled)' : '';
  console.log(`ADN server on http://localhost:${PORT}${managerStatus}`);
});
