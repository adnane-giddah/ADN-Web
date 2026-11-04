// Vercel only serves static files from ./dist, so at build time the manager page
// is copied to the secret path. Nothing in the public site links to it, and
// ADMIN_PATH stays out of the repository. Elsewhere, server/index.mjs serves it.
import { cpSync } from 'node:fs';
import path from 'node:path';

const secret = (process.env.ADMIN_PATH || '').replace(/^\/+|\/+$/g, '');

if (!process.env.VERCEL) {
  process.exit(0);
}
if (!secret) {
  console.log('ADMIN_PATH is not set: the manager page was not published.');
  process.exit(0);
}
if (!/^[\w-]+(\/[\w-]+)*$/.test(secret)) {
  console.error('ADMIN_PATH may only contain letters, numbers, "_", "-" and "/".');
  process.exit(1);
}

cpSync('dist-admin', path.join('dist', secret), { recursive: true });
console.log('Manager page published.');
