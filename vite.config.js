import { defineConfig } from 'vite';
export default defineConfig({
  base: '/still-surface/',
  server: { host: '0.0.0.0', port: 5173 },
  build: { target: 'es2020', outDir: 'dist' },
});
