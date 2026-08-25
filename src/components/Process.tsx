import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROCESS } from '../content'
import { Reveal } from './ui/Primitives'
import { useMediaQuery, useReducedMotion } from '../lib/hooks'

gsap.registerPlugin(ScrollTrigger)

export function Process() {
  const section = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const isNarrow = useMediaQuery('(max-width: 900px)')
  const reduced = useReducedMotion()

  useEffect(() => {
    if (isNarrow || reduced) return
    const sec = section.current
    const tr = track.current
    if (!sec || !tr) return

    const ctx = gsap.context(() => {
      const distance = () => tr.scrollWidth - window.innerWidth + window.innerWidth * 0.08

      const tween = gsap.to(tr, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: () => `+=${distance() + window.innerHeight * 0.4}`,
          pin: true,
          scrub: 0.85,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            setActive(Math.min(PROCESS.length - 1, Math.round(self.progress * (PROCESS.length - 1))))
          },
        },
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    }, sec)

    // Шрифты приезжают позже и меняют ширину трека
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh).catch(() => {})

    return () => ctx.revert()
  }, [isNarrow, reduced])

  return (
    <section className={`process ${isNarrow || reduced ? 'is-static' : ''}`} id="process" ref={section}>
      <div className="process__viewport">
        <div className="shell process__head-wrap">
          <div className="sec-head">
            <span className="sec-head__num">04</span>
            <span className="sec-head__label">Регламент</span>
            <span className="sec-head__rule" />
          </div>
          <div className="process__head">
            <Reveal as="h2" className="h-1" y={40}>
              Пять шагов <span className="italic-serif brass">от сообщения</span> до отчёта
            </Reveal>
            <div className="process__meter" aria-hidden="true">
              {PROCESS.map((_, i) => (
                <span key={i} className={i <= active ? 'is-on' : ''} />
              ))}
              <em className="mono">
                {String(active + 1).padStart(2, '0')} / {String(PROCESS.length).padStart(2, '0')}
              </em>
            </div>
          </div>
        </div>

        <div className="process__track" ref={track}>
          {PROCESS.map((s, i) => (
            <article
              key={s.num}
              className={`step ${i === active ? 'is-active' : ''} ${i < active ? 'is-past' : ''}`}
              data-cursor="hover"
            >
              <div className="step__rail" aria-hidden="true">
                <span className="step__dot" />
                <span className="step__line" />
              </div>
              <span className="step__num">{s.num}</span>
              <h3 className="step__title h-2">{s.t}</h3>
              <p className="step__d">{s.d}</p>
              <span className="step__meta mono">{s.meta}</span>
              <span className="step__ghost" aria-hidden="true">
                {s.num}
              </span>
            </article>
          ))}

          <article className="step step--end">
            <span className="step__num">✦</span>
            <h3 className="step__title h-2">И так двадцать раз за сезон</h3>
            <p className="step__d">
              Именно повторяемость превращает участок в газон. Один раз покосить может кто угодно —
              вопрос в том, кто приедет на восемнадцатый раз в конце августа, когда уже никому не интересно.
            </p>
            <span className="step__meta mono">апрель — октябрь</span>
          </article>
        </div>
      </div>
    </section>
  )
}
