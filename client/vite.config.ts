declare const process: { env: Record<string, string | undefined> };
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_HOST || '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
    allowedHosts: ['localhost', '127.0.0.1', '::1', '.ngrok-free.app', '.ngrok.app'],
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
        xfwd: true,
      },
    },
    hmr: false
  },
});
