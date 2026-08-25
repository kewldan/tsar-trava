import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://<username>.github.io/tsarsky-gazon/
// Меняется в одном месте — здесь и в .github/workflows/deploy.yml ничего трогать не надо.
const REPO = 'tsar-trava'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO}/` : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber'],
          anim: ['gsap', 'motion', 'lenis'],
        },
      },
    },
  },
}))
