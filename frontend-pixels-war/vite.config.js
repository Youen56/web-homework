import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      // This matches any request starting with /api
      '/api': {
        target: 'https://pixels-war.fly.dev',
        changeOrigin: true,
        secure: true,
        // No rewrite function needed here
      }
    }
  }
})
