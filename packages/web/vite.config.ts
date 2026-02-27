import deno from '@deno/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [deno(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': resolve(import.meta.dirname!, '../shared'),
    },
  },
  server: {
    port: 7002,
    proxy: {
      '/core/api': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
      '/content': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
      '/blog/images': {
        target: 'http://localhost:7001',
        changeOrigin: true,
      },
    },
  },
})
