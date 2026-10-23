// Minimal .env loader (KEY=value lines). Real environment variables win.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function loadEnv() {
  const file = fileURLToPath(new URL('../.env', import.meta.url));
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
