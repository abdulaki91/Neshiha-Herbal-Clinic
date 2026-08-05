import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split vendor code out of the app bundle. React/Router/etc. change
        // far less often than app code, so browsers can cache this chunk
        // across deploys instead of re-downloading it on every release —
        // and it stops one 700kB+ "everything" chunk from dominating the
        // very first load.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-icons')) return 'vendor-icons'
          if (id.includes('socket.io')) return 'vendor-socket'
          if (id.includes('@tanstack')) return 'vendor-query'
          if (id.includes('react-dom') || /node_modules\/react\//.test(id)) {
            return 'vendor-react'
          }
          return 'vendor'
        },
      },
    },
  },
})
