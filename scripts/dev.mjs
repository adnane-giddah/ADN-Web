// Starts the review API, the private manager bundle (watch) and the Vite dev server.
import { spawn } from 'node:child_process';
import { loadEnv } from '../server/loadEnv.mjs';

loadEnv();

const env = { ...process.env };
if (!env.ADMIN_TOKEN || !env.ADMIN_PATH) {
  console.log('Manager page disabled: set ADMIN_TOKEN and ADMIN_PATH in .env to enable it.');
} else {
  const adminPath = env.ADMIN_PATH.replace(/^\/+|\/+$/g, '');
  console.log(`Manager page: /${adminPath}/`);
}

const run = (cmd) => spawn(cmd, { stdio: 'inherit', env, shell: true });

const procs = [
  run('node server/index.mjs'),
  run('npx vite build -c vite.admin.config.ts --watch'),
  run('npx vite'),
];
const stop = () => procs.forEach((p) => p.kill());
process.on('SIGINT', stop);
process.on('exit', stop);
