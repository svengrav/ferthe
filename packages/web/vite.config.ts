import deno from '@deno/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [deno(), react(), tailwindcss()],
  server: {
    port: 15173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/blog/images': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
