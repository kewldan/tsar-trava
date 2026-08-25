import { Fragment, useEffect, useRef, useState } from 'react'
import { MANIFESTO, STATS } from '../content'
import { Reveal, Counter } from './ui/Primitives'
import { clamp } from '../lib/hooks'

/**
 * Манифест: длинная фраза, которая проявляется слово за словом
 * по мере прокрутки — не по таймеру, а именно по позиции секции.
 */
function ScrollText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [p, setP] = useState(0)
  const words = text.split(' ')

  useEffect(() => {
    let raf = 0
    const on = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) {
          raf = 0
          return
        }
        const r = el.getBoundingClientRect()
        const vh = window.innerHeight
        // 0 когда блок только вошёл снизу, 1 когда дошёл до верхней трети
        const start = vh * 0.88
        const end = vh * 0.22
        setP(clamp((start - r.top) / (start - end), 0, 1))
        raf = 0
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <p className="manifest__text h-2" ref={ref}>
      {words.map((w, i) => {
        // Каждое слово получает свой отрезок прогресса
        const step = 1 / words.length
        const local = clamp((p - i * step * 0.72) / (step * 2.6), 0, 1)
        return (
          <Fragment key={i}>
            <span
              className="manifest__word"
              style={{
                opacity: 0.11 + local * 0.89,
                filter: `blur(${(1 - local) * 3.5}px)`,
                transform: `translateY(${(1 - local) * 7}px)`,
              }}
            >
              {w}
            </span>{' '}
          </Fragment>
        )
      })}
    </p>
  )
}

export function Manifesto() {
  return (
    <section className="section manifest" id="manifest">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">01</span>
          <span className="sec-head__label">{MANIFESTO.label}</span>
          <span className="sec-head__rule" />
        </div>

        <ScrollText text={MANIFESTO.text} />

        <Reveal mode="fade" delay={120} className="manifest__sign">
          <span className="mono dim">{MANIFESTO.signature}</span>
        </Reveal>

        <div className="manifest__cols">
          {MANIFESTO.columns.map((c, i) => (
            <Reveal key={c.t} mode="fade" delay={i * 140} className="manifest__col">
              <span className="manifest__col-num mono brass">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="h-3">{c.t}</h3>
              <p className="body-s">{c.d}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="shell">
        <div className="stats">
          {STATS.map((s, i) => (
            <Reveal key={s.label} mode="fade" delay={i * 110} className="stat">
              <div className="stat__value">
                <Counter to={s.value} suffix={s.suffix} className="text-brass-grad" />
              </div>
              <div className="stat__label">{s.label}</div>
              <div className="stat__sub mono">{s.sub}</div>
              <span className="stat__bar" aria-hidden="true" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
