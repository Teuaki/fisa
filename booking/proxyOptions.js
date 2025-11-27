import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from '@svgr/rollup';       // <-- FIXED
import proxyOptions from './proxyOptions'; // <-- FIXED

export default defineConfig({
  plugins: [
    react(),
    svgr(), // handle SVG as React components
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 8080,
    proxy: proxyOptions, // your API proxy for Frappe
  },

  build: {
    outDir: '../my_app/public/booking', // <-- Output to Frappe App
    emptyOutDir: true,
    target: 'es2015',
  },
});
