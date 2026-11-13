import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// При build сайтът е под https://donikaiy.github.io/donis-kitchen/ (GitHub Pages).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/donis-kitchen/' : '/',
  plugins: [react()],
}))
