import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      // ✅ Allow use of eval() for dev tooling like Vite
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval';",
    },
  },
});