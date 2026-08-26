import { Fragment, useEffect, useRef, useState } from 'react'
import { MANIFESTO, STATS } from '../content'
import { asset, clamp } from '../lib/hooks'
import { Counter, Reveal } from './ui/primitives'

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
      if (raf) {
        return
      }
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
      if (raf) {
        cancelAnimationFrame(raf)
      }
    }
  }, [])

  return (
    <p className="manifest__text h-2" ref={ref}>
      {words.map((w, i) => {
        // Каждое слово получает свой отрезок прогресса
        const step = 1 / words.length
        const local = clamp((p - i * step * 0.72) / (step * 2.6), 0, 1)
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: слова манифеста не сортируются и не фильтруются, порядок фиксирован
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
          <span className="sec-head__num">I</span>
          <span className="sec-head__label">{MANIFESTO.label}</span>
          <span className="sec-head__rule" />
        </div>

        <div className="manifest__body">
          <div className="manifest__text-col">
            <ScrollText text={MANIFESTO.text} />

            <Reveal mode="fade" delay={120} className="manifest__sign">
              <span className="mono dim">{MANIFESTO.signature}</span>
            </Reveal>

            {/* Сноска к манифесту: шутка заявлена прямо в подписи,
                поэтому кадр не может сойти за настоящую заслугу */}
            <Reveal mode="fade" delay={180} className="manifest__aside">
              <figure>
                <img
                  src={asset(MANIFESTO.aside.photo)}
                  alt={MANIFESTO.aside.alt}
                  width={768}
                  height={1376}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>
                  <span className="mono brass">{MANIFESTO.aside.title}</span>
                  <p className="body-s">{MANIFESTO.aside.text}</p>
                </figcaption>
              </figure>
            </Reveal>
          </div>

          {/* Снимок с выезда рядом с утверждением: заявление и подтверждение в одном экране */}
          <Reveal mode="fade" delay={200} className="manifest__shot">
            <figure>
              <img
                src={asset('team/denis-working.jpg')}
                alt="Мастер ведёт роторную косилку по газону перед домом"
                width={768}
                height={1376}
                loading="lazy"
                decoding="async"
              />
              <span className="manifest__shot-grain" aria-hidden="true" />
              <figcaption className="mono">Среда, третий выезд · Александровка</figcaption>
            </figure>
          </Reveal>
        </div>

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
