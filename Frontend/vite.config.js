import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window', // Fixes 'Uncaught ReferenceError: global is not defined' for SockJS
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your Spring Boot server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});