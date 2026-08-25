import { useEffect, useRef, useState } from 'react'
import { HERO, BRAND, CONTACTS, TICKER } from '../content'
import { SplitText, Btn, Marquee } from './ui/Primitives'
import { useScrollTo } from '../lib/hooks'

export function Hero({ ready }: { ready: boolean }) {
  const [t, setT] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  const scrollTo = useScrollTo()

  // Затухание героя при уходе вниз — считаем сами, без ScrollTrigger
  useEffect(() => {
    let raf = 0
    const on = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const h = window.innerHeight
        setT(Math.min(1, window.scrollY / (h * 0.9)))
        raf = 0
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      window.removeEventListener('scroll', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const cls = ready ? 'hero is-ready' : 'hero'

  return (
    <section className={cls} id="top" ref={wrap}>
      {/* Свечение поверх WebGL — дешёвая замена bloom-проходу */}
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__scrim" aria-hidden="true" />

      <div
        className="hero__content shell"
        style={{
          opacity: 1 - t * 1.15,
          transform: `translate3d(0, ${t * -70}px, 0) scale(${1 - t * 0.055})`,
        }}
      >
        <div className="hero__eyebrow">
          <span className="hero__pip" aria-hidden="true" />
          <span className="mono">{HERO.eyebrow}</span>
        </div>

        <h1 className="hero__title h-mega">
          <span className="hero__line">
            <SplitText text={HERO.line1} delay={120} stagger={40} />
          </span>
          <span className="hero__line hero__line--2">
            <span className="hero__ampersand italic-serif brass">как</span>
            <SplitText text="ПРОТОКОЛ" delay={380} stagger={34} />
          </span>
        </h1>

        <div className="hero__grid">
          <p className="hero__lead lead">{HERO.lead}</p>

          <div className="hero__facts">
            {HERO.facts.map((f, i) => (
              <div className="hero__fact" key={f.k} style={{ transitionDelay: `${900 + i * 130}ms` }}>
                <b className="text-brass-grad">{f.k}</b>
                <span>{f.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero__actions">
          <Btn href={CONTACTS.telegram} variant="solid">
            Бесплатный замер
          </Btn>
          <Btn variant="ghost" onClick={() => scrollTo('pricing')}>
            Смотреть тарифы
          </Btn>
        </div>
      </div>

      <button
        className="hero__scroll"
        onClick={() => scrollTo('manifest')}
        style={{ opacity: 1 - t * 2.4 }}
        data-cursor="hover"
        aria-label="Прокрутить вниз"
      >
        <span className="mono">{HERO.scroll}</span>
        <span className="hero__scroll-rail" aria-hidden="true">
          <i />
        </span>
      </button>

      <div className="hero__corner hero__corner--l" aria-hidden="true">
        <span className="mono">{BRAND.city}</span>
        <span className="mono dim">59.72° N · 30.41° E</span>
      </div>
      <div className="hero__corner hero__corner--r" aria-hidden="true">
        <span className="mono">Сезон 2026</span>
        <span className="mono dim">апрель — октябрь</span>
      </div>

      <div className="hero__ticker" style={{ opacity: 1 - t * 1.6 }}>
        <Marquee items={TICKER} speed={52} />
      </div>
    </section>
  )
}
