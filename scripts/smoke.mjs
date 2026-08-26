/**
 * Дымовой прогон собранной страницы в настоящем Chromium.
 *
 * Проверяет то, что не ловят ни типы, ни линтер:
 *   — страница поднимается и React отрисовывает разметку;
 *   — в консоли нет ошибок, промисы не падают;
 *   — все секции на месте и доступны по якорям из навигации;
 *   — WebGL стартует и прелоадер уходит;
 *   — нет горизонтальной прокрутки на телефоне, планшете и десктопе.
 *
 *   node scripts/smoke.mjs [путь-до-dist]
 *
 * Ожидает готовый dist рядом. Локально: npx vite build && node scripts/smoke.mjs
 */

import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { chromium } from 'playwright'

const DIST = path.resolve(process.argv[2] ?? 'dist')
const PORT = 4275
// base из vite.config.ts — собранный index.html ссылается на ассеты с префиксом
const PREFIX = '/tsar-trava'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

const VIEWPORTS = [
  { name: 'телефон', width: 390, height: 844 },
  { name: 'планшет', width: 820, height: 1180 },
  { name: 'десктоп', width: 1600, height: 950 },
]

const SECTIONS = ['manifest', 'services', 'territory', 'process', 'equipment', 'team', 'pricing', 'faq', 'cta']

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`Нет собранной страницы: ${DIST}/index.html. Сначала vite build.`)
  process.exit(1)
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url ?? '/').split('?')[0])
  if (p.startsWith(PREFIX)) {
    p = p.slice(PREFIX.length)
  }
  if (p === '' || p === '/') {
    p = '/index.html'
  }
  const file = path.join(DIST, p)
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end('forbidden')
    return
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' })
    res.end(buf)
  })
})

await new Promise((resolve) => server.listen(PORT, resolve))
const URL_ = `http://localhost:${PORT}${PREFIX}/`

const failures = []
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) {
    failures.push(`${label}${detail ? `: ${detail}` : ''}`)
  }
}

const browser = await chromium.launch({
  args: [
    // На раннере нет GPU: рендерим WebGL программно, иначе сцена не поднимется
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

let firstPage = null

try {
  for (const vp of VIEWPORTS) {
    console.log(`\n▸ ${vp.name} (${vp.width}×${vp.height})`)

    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.width < 800,
      hasTouch: vp.width < 800,
    })
    if (!firstPage) {
      firstPage = page
    }

    const problems = []
    page.on('console', (m) => {
      if (m.type() === 'error') {
        problems.push(`console: ${m.text()}`)
      }
    })
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
    page.on('requestfailed', (r) => {
      // Шрифты тянутся с внешнего хоста: в закрытом окружении их может не быть,
      // на вёрстку это не влияет
      if (r.url().includes('fonts.g')) {
        return
      }
      problems.push(`request: ${r.url()} — ${r.failure()?.errorText}`)
    })

    const res = await page.goto(URL_, { waitUntil: 'load', timeout: 45_000 })
    check(res?.status() === 200, 'страница отдаётся', `HTTP ${res?.status()}`)

    // Прелоадер держится до первого кадра WebGL — по его уходу
    // видно, что сцена действительно стартовала
    await page
      .waitForFunction(() => document.querySelector('.preloader')?.classList.contains('is-done'), null, {
        timeout: 30_000,
      })
      .then(() => check(true, 'прелоадер отработал'))
      .catch(() => check(false, 'прелоадер отработал', 'не дождались is-done за 30 с'))

    const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length ?? 0)
    check(rootLen > 5000, 'React отрисовал разметку', `${rootLen} символов`)

    const missing = await page.evaluate((ids) => ids.filter((id) => !document.getElementById(id)), SECTIONS)
    check(missing.length === 0, 'все секции на месте', missing.join(', '))

    const canvases = await page.locator('canvas').count()
    check(canvases >= 1, 'canvas WebGL создан', `${canvases} шт.`)

    const overflow = await page.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      if (over <= 1) {
        return { over, culprits: [] }
      }
      const culprits = []
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if ((r.right > de.clientWidth + 2 || r.left < -2) && r.width > 24 && r.height > 4) {
          culprits.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`)
        }
      }
      return { over, culprits: [...new Set(culprits)].slice(0, 6) }
    })
    check(overflow.over <= 1, 'нет горизонтальной прокрутки', overflow.culprits.join(', '))

    // Прокрутка до конца ловит то, что падает уже в процессе
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 90))
      }
    })
    await page.waitForTimeout(700)

    // Снимок принуждает нарисовать кадр: без кадров в headless не двигаются
    // CSS-переходы, и половина блоков осталась бы «непроявленной»
    await page.screenshot({ type: 'jpeg', quality: 1 })
    await page.waitForTimeout(900)

    // Кнопки не должны быть погашены или размыты: именно так выглядела
    // регрессия, которую не ловят ни типы, ни линтер, ни разметка —
    // правило блёкло уезжало не на тот селектор
    const faded = await page.evaluate(() => {
      /** Итоговая прозрачность и размытие с учётом всех предков. */
      const effective = (el) => {
        let node = el
        let opacity = 1
        let blurred = false
        while (node && node !== document.body) {
          const cs = getComputedStyle(node)
          opacity *= Number.parseFloat(cs.opacity)
          if (cs.filter?.includes('blur')) {
            blurred = true
          }
          node = node.parentElement
        }
        return { opacity, blurred }
      }

      const bad = []
      for (const el of document.querySelectorAll('.btn, .nav__link, .form__chip')) {
        const r = el.getBoundingClientRect()
        if (r.width < 4 || r.height < 4) {
          continue
        }
        const { opacity, blurred } = effective(el)
        // Полностью скрытые блоки (не проявившийся reveal) не считаем
        if (opacity < 0.02) {
          continue
        }
        if (blurred || opacity < 0.6) {
          bad.push(`${el.className.split(' ')[0]} (прозрачность ${opacity.toFixed(2)}${blurred ? ', размыта' : ''})`)
        }
      }
      return [...new Set(bad)].slice(0, 5)
    })

    check(faded.length === 0, 'кнопки не погашены и не размыты', faded.join(', '))

    check(problems.length === 0, 'консоль чистая', problems.slice(0, 4).join(' | '))

    if (page !== firstPage) {
      await page.close()
    }
  }
} finally {
  if (failures.length > 0 && firstPage) {
    await firstPage.screenshot({ path: 'smoke-failure.png', fullPage: false }).catch(() => {
      // Снимок — приятный бонус к отчёту, его отсутствие не должно
      // подменять настоящую причину падения
    })
  }
  await browser.close()
  server.close()
}

console.log('')
if (failures.length > 0) {
  console.error(`Проваленных проверок: ${failures.length}`)
  for (const f of failures) {
    console.error(`  · ${f}`)
  }
  process.exit(1)
}
console.log('Все проверки пройдены.')
