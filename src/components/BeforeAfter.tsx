import { useCallback, useEffect, useRef, useState } from 'react'
import { BEFORE_AFTER } from '../content'
import { asset, clamp } from '../lib/hooks'
import { Reveal } from './ui/primitives'

export function BeforeAfter() {
  const wrap = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(0.42)
  const dragging = useRef(false)

  const setFromX = useCallback((clientX: number) => {
    const el = wrap.current
    if (!el) {
      return
    }
    const r = el.getBoundingClientRect()
    setPos(clamp((clientX - r.left) / r.width, 0.02, 0.98))
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) {
        return
      }
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
    if (e.key === 'ArrowLeft') {
      setPos((p) => clamp(p - 0.04, 0.02, 0.98))
    }
    if (e.key === 'ArrowRight') {
      setPos((p) => clamp(p + 0.04, 0.02, 0.98))
    }
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
              <img
                className="ba__art"
                src={asset('before-after/after.jpg')}
                alt="Тот же участок после вывода на регламент: ровный газон с диагональным рисунком покоса"
                width={1376}
                height={768}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <span className="ba__cap ba__cap--r mono">{BEFORE_AFTER.captionAfter}</span>
            </div>

            <div className="ba__layer ba__layer--before">
              <img
                className="ba__art"
                src={asset('before-after/before.jpg')}
                alt="Участок до начала работ: переросшая трава, сорняки, заросшая кромка"
                width={1376}
                height={768}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
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
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
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
