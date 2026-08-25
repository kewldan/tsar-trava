/**
 * Съёмка скриншотов для README.
 *
 *   npx vite build && node scripts/shots.mjs
 *
 * Кадры привязаны к секциям, а не к абсолютной прокрутке: изменилась высота
 * блока — серия всё равно снимется в тех же местах. Результат ложится
 * в docs/screenshots/ как JPEG, чтобы репозиторий не пух.
 */

import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const DIST = path.resolve('dist')
const OUT = path.resolve('docs/screenshots')
const PORT = 4276
const PREFIX = '/tsar-trava'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
}

/** id — якорь секции, extra — сдвиг в экранах от её верха. */
const DESKTOP = [
  { file: 'hero', top: 0 },
  { file: 'manifest', id: 'manifest', extra: 1.42 },
  { file: 'services', id: 'services', extra: 0.42 },
  { file: 'territory', id: 'territory', extra: 0.62 },
  { file: 'process', id: 'process', extra: 0.62 },
  { file: 'equipment', id: 'equipment', extra: 0.22 },
  { file: 'before-after', id: 'equipment', extra: 2.5 },
  { file: 'team', id: 'team', extra: 0.62 },
  { file: 'pricing', id: 'pricing', extra: 0.72 },
  { file: 'calculator', id: 'pricing', extra: 1.5 },
  { file: 'cta', id: 'cta', extra: 0.12 },
]

const MOBILE = [
  { file: 'm-hero', top: 0 },
  { file: 'm-territory', id: 'territory', extra: 0.5 },
  { file: 'm-pricing', id: 'pricing', extra: 1.15 },
]

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('Нет dist/index.html. Сначала: npx vite build')
  process.exit(1)
}
fs.mkdirSync(OUT, { recursive: true })

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url ?? '/').split('?')[0])
  if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length)
  if (p === '' || p === '/') p = '/index.html'
  const file = path.join(DIST, p)
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' })
    res.end(buf)
  })
})
await new Promise((r) => server.listen(PORT, r))
const URL_ = `http://localhost:${PORT}${PREFIX}/`

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

async function shoot(list, { width, height, quality }) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: width < 800,
    hasTouch: width < 800,
  })
  await page.goto(URL_, { waitUntil: 'networkidle' })
  // Даём уйти прелоадеру и раскрутиться ветру в шейдере
  await page.waitForTimeout(5500)

  for (const shot of list) {
    await page.evaluate((s) => {
      let y
      if (s.id) {
        const el = document.getElementById(s.id)
        y = el ? el.getBoundingClientRect().top + window.scrollY - 24 : 0
        if (s.extra) y += window.innerHeight * s.extra
      } else {
        y = s.top ?? 0
      }
      const lenis = window.__lenis
      if (lenis) lenis.scrollTo(y, { immediate: true })
      else window.scrollTo(0, y)
    }, shot)

    // Ждём, пока доиграют reveal-анимации секции
    await page.waitForTimeout(1900)
    const file = path.join(OUT, `${shot.file}.jpg`)
    await page.screenshot({ path: file, type: 'jpeg', quality })
    const kb = (fs.statSync(file).size / 1024).toFixed(0)
    console.log(`  ${shot.file}.jpg — ${kb} KB`)
  }

  await page.close()
}

console.log('Десктоп 1440×900:')
await shoot(DESKTOP, { width: 1440, height: 900, quality: 80 })

console.log('Мобильный 390×844:')
await shoot(MOBILE, { width: 390, height: 844, quality: 82 })

await browser.close()
server.close()

const total = fs
  .readdirSync(OUT)
  .filter((f) => f.endsWith('.jpg'))
  .reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0)
console.log(`\nИтого в docs/screenshots: ${(total / 1024 / 1024).toFixed(2)} МБ`)
