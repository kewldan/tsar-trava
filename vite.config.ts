import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://<username>.github.io/tsar-trava/
// Меняется в одном месте — в .github/workflows/deploy.yml трогать ничего не надо.
// Тот же префикс продублирован в scripts/smoke.mjs и scripts/shots.mjs.
const REPO = 'tsar-trava'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO}/` : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        /**
         * Тяжёлые библиотеки разложены по отдельным чанкам, чтобы их хеши
         * не менялись от правок в коде сайта и файлы жили в кеше браузера
         * между релизами.
         *
         * Vite 8 собирает Rolldown-ом, а он группирует чанки через
         * advancedChunks — объектная и функциональная формы manualChunks
         * из Vite 6 здесь не работают.
         */
        advancedChunks: {
          groups: [
            { name: 'three', test: /[\\/]node_modules[\\/]three[\\/]/ },
            { name: 'r3f', test: /[\\/]node_modules[\\/]@react-three[\\/]/ },
            { name: 'anim', test: /[\\/]node_modules[\\/](gsap|lenis)[\\/]/ },
          ],
        },
      },
    },
  },
}))
