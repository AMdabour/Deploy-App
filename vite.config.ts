import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'client', 'index.html')
    }
  },
  server: {
    allowedHosts: ['8491b2d9-674b-4d4f-bbde-0a2b9e04311e-00-2wxc6tivtddq4.janeway.replit.dev'],
    host: '0.0.0.0', // ✅ Allow external connections for Replit
    port: 5173,
    strictPort: false,
    hmr: {
      port: 5173,
      host: '0.0.0.0'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  }
});