import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/reports': {
        target: 'http://localhost:3000', // Backend server address
        changeOrigin: true, // Changes the origin of the host header to the target URL
        secure: false, // Disable SSL verification if the backend uses self-signed certificates
      },
    },
  },
  build: {
    outDir: 'dist', // Output directory for production build
    emptyOutDir: true, // Clears the output directory before building
  },
  resolve: {
    alias: {
      '@': '/src', // Allows importing files from the `src` directory using `@` as a shortcut
    },
  },
});
