import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const adminPath = env.ADMIN_PATH
    ? '/' + env.ADMIN_PATH.replace(/^\/+|\/+$/g, '')
    : null;
  const proxy: Record<string, string> = { '/api': 'http://localhost:3001' };
  if (adminPath) proxy[adminPath] = 'http://localhost:3001';

  return {
    plugins: [react()],
    base: './',
    build: { outDir: 'dist', sourcemap: false },
    // Dev only: forward the API and the private manager area to the Node server.
    server: {
      proxy,
    },
  };
});
