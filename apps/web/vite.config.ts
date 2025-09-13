import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/vibegate/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/vibegate/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/vibegate/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
