import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/reports': {
        target: 'http://localhost:3000', // backend server address
        changeOrigin: true,
        secure: false,
      },
    },
  },
});