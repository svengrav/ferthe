import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import deno from "@deno/vite-plugin";

// Simple plugin to load .md files as strings
const markdownPlugin = () => {
  return {
    name: 'markdown-loader',
    async load(id: string) {
      if (id.endsWith('.md')) {
        const content = await Deno.readTextFile(id)
        return `export default ${JSON.stringify(content)}`
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    deno(),
    tailwindcss(),
    react(),
    markdownPlugin()
  ], resolve: {
    alias: {
      '@/': `${import.meta.dirname}/`,
    }
  }
})
