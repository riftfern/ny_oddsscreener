import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ['@ny-sharp-edge/shared'],
  },
  server: {
    port: 3000,
    // Reachable from a phone on the same Wi‑Fi (localhost is laptop-only).
    host: true,
    watch: {
      // Two Grok sessions already eat the default 65k inotify watches.
      usePolling: true,
      interval: 400,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
