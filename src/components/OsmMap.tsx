import { useMemo } from 'react'
import mapData from '../data/pushkin-map.json'
import { useInView, useMediaQuery } from '../lib/hooks'

/**
 * Карта Пушкина и Александровской.
 *
 * Геометрия — настоящая, из OpenStreetMap (Overpass), но она вытащена один раз
 * на этапе сборки данных, спроецирована в Web Mercator, упрощена Дугласом–Пекером
 * и лежит рядом в JSON на 58 КБ. Никаких тайловых серверов и внешних запросов
 * в рантайме: рисуем векторы сами, а значит красим их в палитру сайта.
 *
 * Обновить данные: node scripts/build-map.mjs (см. README).
 */

type Layers = Record<string, number[][]>
const DATA = mapData as unknown as {
  w: number
  h: number
  labels: { n: string; x: number; y: number; k: string }[]
  layers: Layers
}

/** Плоский [x,y,x,y…] → строка path. */
function toPath(flat: number[], close = false) {
  let d = `M${flat[0]} ${flat[1]}`
  for (let i = 2; i < flat.length; i += 2) d += `L${flat[i]} ${flat[i + 1]}`
  return close ? d + 'Z' : d
}

/** Один слой одним <path> — так браузер рисует сотни линий за один узел. */
function layerPath(ways: number[][], close = false) {
  return ways.map((w) => toPath(w, close)).join('')
}

// Кадрируем на две рабочие зоны: показываем не весь bbox, а полосу
// Александровская → Пушкин, чтобы обе точки были крупно.
const VIEW = { x: 210, y: 170, w: 660, h: 420 }
// На телефоне тот же кадр даёт нечитаемо мелкие подписи — берём плотнее
const VIEW_NARROW = { x: 268, y: 216, w: 508, h: 330 }

const ZONES = {
  Пушкин: { x: 678.7, y: 394.4, r: 118 },
  Александровка: { x: 341.4, y: 303.8, r: 78 },
}

export function OsmMap({ hover }: { hover: string | null }) {
  const [ref, seen] = useInView<HTMLDivElement>({ threshold: 0.2 })
  const narrow = useMediaQuery('(max-width: 700px)')
  const V = narrow ? VIEW_NARROW : VIEW

  const paths = useMemo(
    () => ({
      green: layerPath(DATA.layers.green, true),
      water: layerPath(DATA.layers.water, true),
      waterway: layerPath(DATA.layers.waterway),
      rail: layerPath(DATA.layers.rail),
      minor: layerPath(DATA.layers.minor),
      mid: layerPath(DATA.layers.mid),
      major: layerPath(DATA.layers.major),
    }),
    [],
  )

  const dim = (name: string) => (hover && hover !== name ? 'is-dim' : hover === name ? 'is-hot' : '')

  return (
    <div className={`osm ${seen ? 'is-in' : ''}`} ref={ref}>
      <svg
        viewBox={`${V.x} ${V.y} ${V.w} ${V.h}`}
        role="img"
        aria-label="Карта Пушкина и Александровской с зонами обслуживания"
      >
        <defs>
          <radialGradient id="osm-zone-a" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#2f8a55" stopOpacity=".55" />
            <stop offset="55%" stopColor="#2f8a55" stopOpacity=".16" />
            <stop offset="100%" stopColor="#2f8a55" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="osm-zone-b" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#c8a96a" stopOpacity=".48" />
            <stop offset="55%" stopColor="#c8a96a" stopOpacity=".14" />
            <stop offset="100%" stopColor="#c8a96a" stopOpacity="0" />
          </radialGradient>
          {/* Внутри рабочих зон дороги светятся ярче — маска из двух кругов */}
          <mask id="osm-served">
            <rect x={V.x} y={V.y} width={V.w} height={V.h} fill="black" />
            <circle cx={ZONES['Пушкин'].x} cy={ZONES['Пушкин'].y} r={ZONES['Пушкин'].r} fill="white" />
            <circle
              cx={ZONES['Александровка'].x}
              cy={ZONES['Александровка'].y}
              r={ZONES['Александровка'].r}
              fill="white"
            />
          </mask>
          <linearGradient id="osm-link" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c8a96a" stopOpacity=".15" />
            <stop offset="50%" stopColor="#c8a96a" stopOpacity=".9" />
            <stop offset="100%" stopColor="#2f8a55" stopOpacity=".3" />
          </linearGradient>
        </defs>

        <rect x={V.x} y={V.y} width={V.w} height={V.h} className="osm__bg" />

        {/* Координатная сетка поверх фона */}
        <g className="osm__grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={V.x + i * 60} y1={V.y} x2={V.x + i * 60} y2={V.y + V.h} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1={V.x} y1={V.y + i * 60} x2={V.x + V.w} y2={V.y + i * 60} />
          ))}
        </g>

        {/* Ландшафт */}
        <path className="osm__green" d={paths.green} />
        <path className="osm__water" d={paths.water} />
        <path className="osm__waterway" d={paths.waterway} />

        {/* Дорожная сеть: базовый слой */}
        <g className="osm__roads">
          <path className="osm__rail" d={paths.rail} />
          <path className="osm__minor" d={paths.minor} />
          <path className="osm__mid" d={paths.mid} />
          <path className="osm__major" d={paths.major} />
        </g>

        {/* Ореолы рабочих зон */}
        <circle
          className={`osm__halo ${dim('Пушкин')}`}
          cx={ZONES['Пушкин'].x}
          cy={ZONES['Пушкин'].y}
          r={ZONES['Пушкин'].r}
          fill="url(#osm-zone-a)"
        />
        <circle
          className={`osm__halo ${dim('Александровка')}`}
          cx={ZONES['Александровка'].x}
          cy={ZONES['Александровка'].y}
          r={ZONES['Александровка'].r}
          fill="url(#osm-zone-b)"
        />

        {/* Та же сеть, но подсвеченная внутри зон */}
        <g className="osm__served" mask="url(#osm-served)">
          <path className="osm__minor osm__minor--lit" d={paths.minor} />
          <path className="osm__mid osm__mid--lit" d={paths.mid} />
          <path className="osm__major osm__major--lit" d={paths.major} />
        </g>

        {/* Границы зон */}
        {(['Пушкин', 'Александровка'] as const).map((name) => (
          <g key={name} className={`osm__ring ${dim(name)}`}>
            <circle cx={ZONES[name].x} cy={ZONES[name].y} r={ZONES[name].r} className="osm__ring-dash" />
            <circle cx={ZONES[name].x} cy={ZONES[name].y} r={6} className="osm__pin" />
            <circle cx={ZONES[name].x} cy={ZONES[name].y} r={6} className="osm__pin-pulse" />
          </g>
        ))}

        {/* Перегон между зонами */}
        <path
          className="osm__link"
          d={`M${ZONES['Александровка'].x + 70} ${ZONES['Александровка'].y + 18} Q 510 ${ZONES['Александровка'].y + 90} ${ZONES['Пушкин'].x - 108} ${ZONES['Пушкин'].y - 14}`}
          stroke="url(#osm-link)"
        />
        <text className="osm__link-label" x="512" y="386" textAnchor="middle">
          8 мин · 6,4 км
        </text>

        {/* Подписи населённых пунктов */}
        <g className="osm__labels">
          {DATA.labels.map((l) => {
            const isZone = l.n === 'Пушкин' || l.n === 'Александровская'
            const shown = l.n === 'Александровская' ? 'АЛЕКСАНДРОВКА' : l.n.toUpperCase()
            return (
              <text
                key={l.n}
                x={l.x}
                y={l.y + (isZone ? -18 : 4)}
                textAnchor="middle"
                className={isZone ? 'osm__label osm__label--zone' : 'osm__label'}
              >
                {shown}
              </text>
            )
          })}
        </g>

        {/* Служебная разметка */}
        <g className="osm__marks">
          <text x={V.x + 14} y={V.y + 24}>
            OPENSTREETMAP · ODbL
          </text>
          <text x={V.x + V.w - 14} y={V.y + 24} textAnchor="end">
            59.72° N · 30.41° E
          </text>
          <text x={V.x + 14} y={V.y + V.h - 14}>
            ЗОНЫ ВЫЕЗДА · СЕЗОН 2026
          </text>
        </g>

        {/* Масштабная линейка: 1000 px viewBox ≈ 11,2 км по долготе на этой широте */}
        <g className="osm__scale">
          <line x1={V.x + V.w - 110} y1={V.y + V.h - 18} x2={V.x + V.w - 21} y2={V.y + V.h - 18} />
          <line x1={V.x + V.w - 110} y1={V.y + V.h - 23} x2={V.x + V.w - 110} y2={V.y + V.h - 13} />
          <line x1={V.x + V.w - 21} y1={V.y + V.h - 23} x2={V.x + V.w - 21} y2={V.y + V.h - 13} />
          <text x={V.x + V.w - 65} y={V.y + V.h - 26} textAnchor="middle">
            1 км
          </text>
        </g>
      </svg>

      <div className="osm__legend">
        <span>
          <i className="k-served" />
          зона выезда
        </span>
        <span>
          <i className="k-road" />
          дороги вне зоны
        </span>
        <span>
          <i className="k-green" />
          парки и лес
        </span>
        <span>
          <i className="k-water" />
          вода
        </span>
        <em>© OpenStreetMap contributors · ODbL · данные обработаны локально</em>
      </div>
    </div>
  )
}
