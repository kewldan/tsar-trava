import { useCallback, useEffect, useRef, useState } from 'react'
import { BEFORE_AFTER } from '../content'
import { Reveal } from './ui/Primitives'
import { clamp } from '../lib/hooks'

/** Запущенный газон: пятна, мох, проплешины, никакого рисунка. */
function LawnBefore() {
  return (
    <svg className="ba__art" viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ba-b-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1410" />
          <stop offset="42%" stopColor="#141d16" />
          <stop offset="100%" stopColor="#0a110c" />
        </linearGradient>
        <radialGradient id="ba-b-patch">
          <stop offset="0%" stopColor="#6b6540" stopOpacity=".72" />
          <stop offset="100%" stopColor="#6b6540" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ba-b-moss">
          <stop offset="0%" stopColor="#2b4a35" stopOpacity=".62" />
          <stop offset="100%" stopColor="#2b4a35" stopOpacity="0" />
        </radialGradient>
        <filter id="ba-b-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" seed="7" />
          <feColorMatrix type="saturate" values="0.15" />
        </filter>
      </defs>

      <rect width="1200" height="750" fill="url(#ba-b-sky)" />

      {/* Неровные пятна выгорания и мха */}
      <ellipse cx="300" cy="430" rx="230" ry="120" fill="url(#ba-b-patch)" />
      <ellipse cx="860" cy="520" rx="290" ry="150" fill="url(#ba-b-patch)" opacity=".7" />
      <ellipse cx="620" cy="260" rx="200" ry="90" fill="url(#ba-b-moss)" />
      <ellipse cx="150" cy="640" rx="240" ry="110" fill="url(#ba-b-moss)" opacity=".8" />

      {/* Кривая дорожка без кромки */}
      <path d="M-40 700 C 280 620, 520 600, 1240 470 L 1240 750 L -40 750 Z" fill="#151710" opacity=".9" />
      <path
        d="M-40 700 C 280 620, 520 600, 1240 470"
        stroke="#3a3a28"
        strokeWidth="3"
        fill="none"
        opacity=".7"
        strokeDasharray="26 14 9 18"
      />

      {/* Хаотично торчащая трава */}
      <g stroke="#28402d" strokeWidth="2.4" strokeLinecap="round" opacity=".85">
        {Array.from({ length: 130 }).map((_, i) => {
          const x = (i * 97.3) % 1200
          const y = 300 + ((i * 137) % 420)
          const h = 16 + ((i * 53) % 30)
          const tilt = (((i * 71) % 40) - 20) * 1.4
          return <path key={i} d={`M${x} ${y} q ${tilt / 2} ${-h / 2} ${tilt} ${-h}`} />
        })}
      </g>

      <rect width="1200" height="750" filter="url(#ba-b-noise)" opacity=".16" style={{ mixBlendMode: 'overlay' }} />
      <rect width="1200" height="750" fill="#070b08" opacity=".28" />
    </svg>
  )
}

/** После регламента: ровный тон, диагональные полосы, резаная кромка. */
function LawnAfter() {
  return (
    <svg className="ba__art" viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ba-a-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#153a26" />
          <stop offset="55%" stopColor="#1f5c3a" />
          <stop offset="100%" stopColor="#0f2b1c" />
        </linearGradient>
        <pattern id="ba-a-stripe" width="76" height="76" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
          <rect width="38" height="76" fill="#ffffff" opacity=".062" />
          <rect x="38" width="38" height="76" fill="#000000" opacity=".11" />
        </pattern>
        <radialGradient id="ba-a-moon" cx="72%" cy="16%">
          <stop offset="0%" stopColor="#e3c88f" stopOpacity=".38" />
          <stop offset="100%" stopColor="#e3c88f" stopOpacity="0" />
        </radialGradient>
        <filter id="ba-a-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect width="1200" height="750" fill="url(#ba-a-base)" />
      <rect width="1200" height="750" fill="url(#ba-a-stripe)" />
      <rect width="1200" height="750" fill="url(#ba-a-moon)" />

      {/* Дорожка с прорезанной кромкой */}
      <path d="M-40 706 C 300 632, 540 606, 1240 478 L 1240 750 L -40 750 Z" fill="#0c1610" />
      <path d="M-40 700 C 300 626, 540 600, 1240 472" stroke="#c8a96a" strokeWidth="2.2" fill="none" opacity=".85" />
      <path d="M-40 712 C 300 638, 540 612, 1240 484" stroke="#0a1a11" strokeWidth="6" fill="none" opacity=".8" />

      {/* Ровный ворс по направлению полос */}
      <g stroke="#2f8a55" strokeWidth="1.6" strokeLinecap="round" opacity=".5">
        {Array.from({ length: 260 }).map((_, i) => {
          const x = (i * 61.3) % 1200
          const y = 210 + ((i * 149) % 480)
          return <path key={i} d={`M${x} ${y} l 11 -19`} />
        })}
      </g>

      <rect width="1200" height="750" filter="url(#ba-a-noise)" opacity=".07" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  )
}

export function BeforeAfter() {
  const wrap = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(0.42)
  const dragging = useRef(false)

  const setFromX = useCallback((clientX: number) => {
    const el = wrap.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos(clamp((clientX - r.left) / r.width, 0.02, 0.98))
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      setFromX(e.clientX)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [setFromX])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPos((p) => clamp(p - 0.04, 0.02, 0.98))
    if (e.key === 'ArrowRight') setPos((p) => clamp(p + 0.04, 0.02, 0.98))
  }

  return (
    <section className="section ba">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">—</span>
          <span className="sec-head__label">{BEFORE_AFTER.label}</span>
          <span className="sec-head__rule" />
        </div>

        <div className="ba__top">
          <Reveal as="h2" className="h-1" y={44}>
            {BEFORE_AFTER.title}
          </Reveal>
          <Reveal mode="fade" delay={150}>
            <p className="lead ba__lead">{BEFORE_AFTER.lead}</p>
          </Reveal>
        </div>

        <Reveal mode="fade" delay={100}>
          <div
            className="ba__stage"
            ref={wrap}
            style={{ '--pos': `${pos * 100}%` } as React.CSSProperties}
            onPointerDown={(e) => {
              dragging.current = true
              document.body.style.userSelect = 'none'
              setFromX(e.clientX)
            }}
            data-cursor="drag"
            data-cursor-label="тяните"
          >
            <div className="ba__layer ba__layer--after">
              <LawnAfter />
              <span className="ba__cap ba__cap--r mono">{BEFORE_AFTER.captionAfter}</span>
            </div>

            <div className="ba__layer ba__layer--before">
              <LawnBefore />
              <span className="ba__cap ba__cap--l mono">{BEFORE_AFTER.captionBefore}</span>
            </div>

            <div
              className="ba__handle"
              role="slider"
              tabIndex={0}
              aria-label="Сравнение до и после"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos * 100)}
              onKeyDown={onKey}
            >
              <span className="ba__handle-line" />
              <span className="ba__handle-knob">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M9 7 4 12l5 5M15 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>

            <span className="ba__badge mono">{Math.round(pos * 100)}%</span>
          </div>
        </Reveal>

        <div className="ba__points">
          {BEFORE_AFTER.points.map((p, i) => (
            <Reveal key={p} mode="fade" delay={i * 90} className="ba__point">
              <span className="mono brass">{String(i + 1).padStart(2, '0')}</span>
              <span>{p}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
