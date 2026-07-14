import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { ecoApiPlugin } from './server/ecoApi.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), ecoApiPlugin(env.WARSAW_API_TOKEN)],
  }
})
