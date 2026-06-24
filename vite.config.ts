import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The isolated Firebase SDK vendor chunk is intentionally large (and long
    // cached) — it now also carries the IndexedDB offline-persistence code. Raise
    // the limit so the build stays clean now that this vendor code is split out.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing vendors into their own long-cached chunks
        // so app updates don't force re-downloading Firebase/React, and the
        // browser can fetch them in parallel.
        manualChunks(id: string) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase'
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react'
          }
        },
      },
    },
  },
})
