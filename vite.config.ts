import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  define: process.env.VERCEL
    ? {
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(''),
        'import.meta.env.VITE_PROXY_POLLING': JSON.stringify('1'),
      }
    : {},
  clearScreen: false,
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/socket.io': { target: 'http://127.0.0.1:3001', ws: true },
    },
  },
});
