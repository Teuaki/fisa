import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import path from 'path';                // FIXED: alias uses this
import proxyOptions from './proxyOptions'; // FIXED: proxy settings

export default defineConfig({
  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 8080,
    proxy: proxyOptions, // optional
  },

  build: {
    outDir: '../my_app/public/booking', // Correct public path
    emptyOutDir: true,
    target: 'es2015',
  },
});
