import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { designLabApiPlugin } from './server/api-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), designLabApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
