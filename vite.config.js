import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The tree inventory is intentionally emitted as a separate data chunk.
    chunkSizeWarningLimit: 900,
  },
})
