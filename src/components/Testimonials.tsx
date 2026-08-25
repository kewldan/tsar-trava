import { TESTIMONIALS, TICKER } from '../content'
import { Marquee, Reveal } from './ui/primitives'

function Row({ items, reverse }: { items: typeof TESTIMONIALS; reverse?: boolean }) {
  return (
    <div className={`tst__row ${reverse ? 'tst__row--rev' : ''}`}>
      <div className="tst__track">
        {[...items, ...items].map((t, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: лента намеренно дублирует один и тот же список — различить копии можно только позицией
          <blockquote className="tst" key={i} data-cursor="hover">
            <span className="tst__mark" aria-hidden="true">
              “
            </span>
            <p className="tst__text">{t.text}</p>
            <footer className="tst__foot">
              <div>
                <b>{t.author}</b>
                <span className="mono dim">{t.meta}</span>
              </div>
              <span className="tst__plan mono">{t.plan}</span>
            </footer>
            <span className="tst__glow" aria-hidden="true" />
          </blockquote>
        ))}
      </div>
    </div>
  )
}

export function Testimonials() {
  // Две ленты навстречу друг другу
  const rowA = TESTIMONIALS.slice(0, 3)
  const rowB = TESTIMONIALS.slice(3)

  return (
    <section className="section section--tight tst-sec">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">—</span>
          <span className="sec-head__label">Отзывы</span>
          <span className="sec-head__rule" />
        </div>
        <Reveal as="h2" className="h-1 tst-sec__title" y={40}>
          Что говорят <span className="italic-serif brass">через три сезона</span>
        </Reveal>
      </div>

      <div className="tst__rows">
        <Row items={rowA} />
        <Row items={rowB} reverse={true} />
      </div>

      <div className="tst__ticker">
        <Marquee items={TICKER} speed={68} reverse={true} separator="·" />
      </div>
    </section>
  )
}
