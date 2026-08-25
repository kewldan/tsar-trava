/**
 * Пересборка векторной карты Пушкина и Александровской из OpenStreetMap.
 *
 * Данные берутся один раз, здесь, и попадают в src/data/pushkin-map.json.
 * В рантайме сайт ни к каким тайловым серверам не ходит.
 *
 *   1) выкачать геометрию и населённые пункты:
 *      curl -s -X POST --data-binary @scripts/overpass-ways.overpassql  *           https://overpass-api.de/api/interpreter -o tmp/osm.json
 *      curl -s -X POST --data-binary @scripts/overpass-places.overpassql  *           https://overpass-api.de/api/interpreter -o tmp/places.json
 *
 *   2) собрать:
 *      node scripts/build-map.mjs tmp src/data/pushkin-map.json
 *
 * Данные © OpenStreetMap contributors, лицензия ODbL.
 */

import fs from 'node:fs'

const SP = process.argv[2]
const OUT = process.argv[3]

const BBOX = { s: 59.68, w: 30.28, n: 59.762, e: 30.48 }
const WIDTH = 1000

// Web Mercator
const mx = (lon) => (lon * Math.PI) / 180
const my = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

const x0 = mx(BBOX.w),
  x1 = mx(BBOX.e)
const y0 = my(BBOX.n),
  y1 = my(BBOX.s) // y растёт вниз в экранных координатах
const scale = WIDTH / (x1 - x0)
const HEIGHT = +Math.abs((y1 - y0) * scale).toFixed(1)

const P = (lat, lon) => [(mx(lon) - x0) * scale, (my(lat) - y0) * -scale]

// Дуглас–Пекер
function simplify(pts, tol) {
  if (pts.length < 3) return pts
  const sq = tol * tol
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let maxD = 0,
      idx = -1
    const [ax, ay] = pts[a],
      [bx, by] = pts[b]
    const dx = bx - ax,
      dy = by - ay
    const len = dx * dx + dy * dy
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i]
      let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const qx = ax + t * dx,
        qy = ay + t * dy
      const d = (px - qx) ** 2 + (py - qy) ** 2
      if (d > maxD) {
        maxD = d
        idx = i
      }
    }
    if (maxD > sq && idx > 0) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}

const osm = JSON.parse(fs.readFileSync(`${SP}/osm.json`, 'utf8'))

const HW = (t) => (t || '').replace(/_link$/, '')
const layers = { green: [], water: [], waterway: [], rail: [], major: [], mid: [], minor: [] }

for (const el of osm.elements) {
  if (el.type !== 'way' || !el.geometry) continue
  const t = el.tags || {}
  let layer = null
  if (t.leisure === 'park' || t.leisure === 'garden') layer = 'green'
  else if (['forest', 'grass', 'meadow', 'cemetery'].includes(t.landuse)) layer = 'green'
  else if (t.natural === 'water') layer = 'water'
  else if (t.waterway) layer = 'waterway'
  else if (t.railway) layer = 'rail'
  else if (t.highway) {
    const h = HW(t.highway)
    if (['motorway', 'trunk', 'primary'].includes(h)) layer = 'major'
    else if (['secondary', 'tertiary'].includes(h)) layer = 'mid'
    else layer = 'minor'
  }
  if (!layer) continue

  // Обрезаем по bbox грубо: пропускаем точки далеко за краем
  let pts = el.geometry.map((g) => P(g.lat, g.lon))
  const tol = layer === 'minor' ? 1.4 : layer === 'green' || layer === 'water' ? 1.6 : 0.9
  pts = simplify(pts, tol)
  if (pts.length < 2) continue

  // Маленькие пятна выкидываем — на экране их всё равно не видно
  let minX = 1e9,
    maxX = -1e9,
    minY = 1e9,
    maxY = -1e9
  for (const [x, y] of pts) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  const span = Math.max(maxX - minX, maxY - minY)
  if ((layer === 'green' || layer === 'water') && span < 9) continue
  if (layer === 'minor' && span < 4) continue

  const flat = []
  for (const [x, y] of pts) flat.push(+x.toFixed(1), +y.toFixed(1))
  layers[layer].push(flat)
}

const places = JSON.parse(fs.readFileSync(`${SP}/places.json`, 'utf8'))
const wanted = new Set([
  'Пушкин',
  'Александровская',
  'Павловск',
  'Тярлево',
  'Гуммолосары',
  'София',
  'Славянка',
  'Детскосельский',
])
const labels = places.elements
  .filter((e) => e.tags?.name && wanted.has(e.tags.name))
  .map((e) => {
    const [x, y] = P(e.lat, e.lon)
    return { n: e.tags.name, x: +x.toFixed(1), y: +y.toFixed(1), k: e.tags.place }
  })

const data = { w: WIDTH, h: HEIGHT, bbox: BBOX, labels, layers }
const json = JSON.stringify(data)
fs.writeFileSync(OUT, json)

console.log('height', HEIGHT)
console.log('counts', Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.length])))
console.log('labels', labels.map((l) => l.n).join(', '))
console.log('bytes', json.length, '≈', (json.length / 1024).toFixed(0) + 'KB')
