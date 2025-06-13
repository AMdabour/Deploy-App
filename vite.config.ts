// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';
// import { fileURLToPath } from 'node:url';
// import tailwindcss from '@tailwindcss/vite';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, 'client', 'src'),
//       '@shared': path.resolve(__dirname, 'shared'),
//     },
//   },
//   root: path.resolve(__dirname, 'client'),
//   build: {
//     outDir: path.resolve(__dirname, 'dist/'),
//     emptyOutDir: true,
//   },
// });

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
    host: true, // ✅ Allow external connections
    port: 5173,
    strictPort: false,
    // ✅ Remove proxy in development since we're using single server
    proxy: undefined
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  }
});
