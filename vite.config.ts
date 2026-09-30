import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getGitHubStats } from './api/_github-stats'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'github-stats-dev',
    configureServer(server) {
      server.middlewares.use('/api/github-stats', async (_request, response) => {
        try {
          const stats = await getGitHubStats()
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(stats))
        } catch {
          response.statusCode = 503
          response.end(JSON.stringify({ error: 'GitHub activity is unavailable right now.' }))
        }
      })
    },
  }],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
          if (id.includes('contentful')) return 'vendor-contentful';
          if (id.includes('highlight.js')) return 'vendor-hljs';
          if (id.includes('react-dom') || id.includes('react-router') || (id.includes('node_modules/react/') )) return 'vendor-react';
        },
      },
    },
  },
})
