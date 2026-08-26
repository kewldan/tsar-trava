import { lazy, Suspense, useEffect, useRef } from 'react'
import { EQUIPMENT } from '../content'
import { clamp, useInView, useReducedMotion } from '../lib/hooks'
import { Reveal } from './ui/primitives'

const Scissors = lazy(() => import('../three/Scissors').then((m) => ({ default: m.Scissors })))

export function Equipment() {
  const [ref, seen] = useInView<HTMLDivElement>({ threshold: 0.15, once: false })
  const speed = useRef(0.55)
  const reduced = useReducedMotion()

  // Барабан раскручивается от скорости прокрутки — как настоящий, от протяжки
  useEffect(() => {
    if (reduced) {
      return
    }
    let last = window.scrollY
    let lastT = performance.now()
    let raf = 0

    const decay = () => {
      speed.current += (0.55 - speed.current) * 0.04
      raf = requestAnimationFrame(decay)
    }
    raf = requestAnimationFrame(decay)

    const on = () => {
      const now = performance.now()
      const dt = Math.max(16, now - lastT)
      const v = Math.abs(window.scrollY - last) / dt
      speed.current = clamp(0.55 + v * 5.5, 0.55, 9)
      last = window.scrollY
      lastT = now
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      window.removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <section className="section equip" id="equipment">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">V</span>
          <span className="sec-head__label">{EQUIPMENT.label}</span>
          <span className="sec-head__rule" />
        </div>

        <div className="equip__grid">
          <div className="equip__left">
            <Reveal as="h2" className="h-1" y={44}>
              {EQUIPMENT.title}
            </Reveal>
            <Reveal mode="fade" delay={150}>
              <p className="lead equip__lead">{EQUIPMENT.lead}</p>
            </Reveal>

            <div className="equip__specs">
              {EQUIPMENT.specs.map((s, i) => (
                <Reveal key={s.k} mode="fade" delay={220 + i * 90} className="equip__spec">
                  <span className="mono dim">{s.k}</span>
                  <span className="equip__spec-v">{s.v}</span>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="equip__stage" ref={ref} data-cursor="hover" data-cursor-label="щёлк">
            <div className="equip__stage-glow" aria-hidden="true" />
            <div className="equip__canvas">
              {seen && !reduced && (
                <Suspense fallback={null}>
                  <Scissors speedRef={speed} />
                </Suspense>
              )}
            </div>
            <div className="equip__stage-meta">
              <span className="mono">НОЖНИЦЫ · ФИНИШНАЯ ДОВОДКА</span>
              <span className="mono dim">последние сантиметры у клумб и фонарей — вручную</span>
            </div>
            <span className="equip__cross equip__cross--tl" aria-hidden="true" />
            <span className="equip__cross equip__cross--tr" aria-hidden="true" />
            <span className="equip__cross equip__cross--bl" aria-hidden="true" />
            <span className="equip__cross equip__cross--br" aria-hidden="true" />
          </div>
        </div>

        <div className="equip__list">
          {EQUIPMENT.items.map((it, i) => (
            <Reveal key={it.name} mode="fade" delay={i * 60} className="equip__row">
              <div className="equip__row-in" data-cursor="hover">
                <span className="equip__row-num mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="equip__row-name">{it.name}</span>
                <span className="equip__row-spec mono dim">{it.spec}</span>
                <span className="equip__row-tag">{it.tag}</span>
                <span className="equip__row-fill" aria-hidden="true" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
