/**
 * Пережатие фотографий в public/.
 *
 *   node scripts/optimize-images.mjs [--width=1600] [--quality=0.72] [--dry]
 *
 * Гонять после добавления любого нового снимка: исходники из генератора
 * весят под мегабайт каждый, а на странице их уже несколько.
 *
 * Кодировщик — Chromium из Playwright, который и так стоит для дымового
 * прогона. Отдельная нативная зависимость вроде sharp ради этого не нужна.
 * Файл перезаписывается, только если стал меньше исходного.
 */

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? Number(hit.split('=')[1]) : fallback
}

const MAX_WIDTH = flag('width', 1600)
const QUALITY = flag('quality', 0.72)
const DRY = args.includes('--dry')
const JPEG_EXT = /\.jpe?g$/i
const ROOT = path.resolve('public')

/** Рекурсивно собираемjpg-и, минуя всё остальное. */
function collect(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...collect(p))
    } else if (JPEG_EXT.test(entry.name)) {
      out.push(p)
    }
  }
  return out
}

const files = collect(ROOT)
if (files.length === 0) {
  console.log('В public/ нет jpg — нечего жать.')
  process.exit(0)
}

const browser = await chromium.launch()
const page = await browser.newPage()

let before = 0
let after = 0

for (const file of files) {
  const src = fs.readFileSync(file)
  const dataUrl = `data:image/jpeg;base64,${src.toString('base64')}`

  const encoded = await page.evaluate(
    async ([url, maxWidth, quality]) => {
      const img = new Image()
      img.src = url
      await img.decode()

      const scale = Math.min(1, maxWidth / img.naturalWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)

      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      return {
        data: canvas.toDataURL('image/jpeg', quality).split(',')[1],
        w: canvas.width,
        h: canvas.height,
      }
    },
    [dataUrl, MAX_WIDTH, QUALITY],
  )

  const out = Buffer.from(encoded.data, 'base64')
  const name = path.relative(ROOT, file).replace(/\\/g, '/')
  before += src.length
  // Перезаписываем, только если выигрыш заметный. Иначе повторный прогон
  // пережимал бы уже сжатое и каждый раз терял качество на ровном месте.
  const kept = out.length < src.length * 0.9

  if (kept && !DRY) {
    fs.writeFileSync(file, out)
  }
  after += kept ? out.length : src.length

  const kb = (n) => `${Math.round(n / 1024)} KB`
  console.log(
    kept
      ? `  ${name} — ${kb(src.length)} → ${kb(out.length)} (${encoded.w}×${encoded.h})`
      : `  ${name} — уже сжат, пропускаем`,
  )
}

await browser.close()

const mb = (n) => (n / 1024 / 1024).toFixed(2)
console.log(`\nИтого: ${mb(before)} МБ → ${mb(after)} МБ${DRY ? ' (пробный прогон, файлы не тронуты)' : ''}`)
