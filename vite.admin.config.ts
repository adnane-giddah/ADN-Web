import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Separate bundle for the private manager page. The server only serves it at
// the secret path, so the public site never contains it.
export default defineConfig({
  root: 'admin',
  plugins: [react()],
  base: './',
  publicDir: '../public',
  build: { outDir: '../dist-admin', emptyOutDir: true, sourcemap: false },
});
