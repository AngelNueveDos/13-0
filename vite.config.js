import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages the app is served from /<repo>/, so assets need that base.
// Vercel (and local dev) serve from the root.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/13-0/' : '/',
  plugins: [react()],
})
