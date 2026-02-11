import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow access from network
    port: 3000, // Frontend runs on port 3000
    watch: {
      usePolling: true, // Use polling for file changes (useful in Docker)
    },
  },
})
