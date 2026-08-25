import { SERVICES } from '../content'
import { Reveal } from './ui/Primitives'
import { useTilt } from '../lib/hooks'

const ICONS: Record<string, React.ReactNode> = {
  mower: (
    <>
      <path d="M6 30h20a4 4 0 0 0 4-4v-6H14l-2 4H6a3 3 0 0 0 0 6Z" />
      <circle cx="11" cy="30" r="4" />
      <circle cx="27" cy="29" r="5" />
      <path d="M30 20 34 8h6" />
      <path d="M4 34h36" opacity=".4" />
    </>
  ),
  edge: (
    <>
      <path d="M4 30h16" />
      <path d="M20 30V14" />
      <path d="M20 14h20" opacity=".45" />
      <path d="M24 30h16" opacity=".45" />
      <circle cx="20" cy="30" r="3" />
      <path d="M12 34v6M28 34v6" opacity=".35" />
    </>
  ),
  aerate: (
    <>
      <rect x="8" y="10" width="28" height="10" rx="3" />
      <path d="M12 20v10M18 20v14M24 20v10M30 20v14" />
      <path d="M6 36h32" opacity=".4" />
    </>
  ),
  verticut: (
    <>
      <circle cx="22" cy="20" r="11" />
      <path d="M22 9v22M11 20h22M14 12l16 16M30 12 14 28" />
    </>
  ),
  feed: (
    <>
      <path d="M22 38V16" />
      <path d="M22 16c0-6 5-10 12-11 1 7-3 13-12 11Z" />
      <path d="M22 24c0-5-4-8-10-9-.8 6 2.5 11 10 9Z" opacity=".55" />
      <path d="M8 38h28" opacity=".4" />
    </>
  ),
  revive: (
    <>
      <path d="M36 20a14 14 0 1 1-4.1-9.9" />
      <path d="M32 4v7h-7" />
      <path d="M16 22l4 4 8-9" />
    </>
  ),
}

function Card({ s, i }: { s: (typeof SERVICES)[number]; i: number }) {
  const ref = useTilt<HTMLElement>(7)
  return (
    <Reveal mode="fade" delay={i * 90} className="svc-wrap">
      <article className="svc" ref={ref} data-cursor="hover">
        <span className="svc__spot" aria-hidden="true" />
        <span className="svc__edge" aria-hidden="true" />

        <header className="svc__head">
          <span className="svc__num mono">{s.num}</span>
          <span className="svc__icon" aria-hidden="true">
            <svg
              viewBox="0 0 44 44"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS[s.icon]}
            </svg>
          </span>
        </header>

        <h3 className="svc__title h-3">{s.title}</h3>
        <p className="svc__d body-s">{s.d}</p>

        <ul className="svc__bullets">
          {s.bullets.map((b) => (
            <li key={b}>
              <i aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>

        <footer className="svc__foot">
          <span className="svc__price">{s.price}</span>
          <span className="svc__go" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 13 13 3M6 3h7v7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </footer>
      </article>
    </Reveal>
  )
}

export function Services() {
  return (
    <section className="section services" id="services">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">02</span>
          <span className="sec-head__label">Услуги</span>
          <span className="sec-head__rule" />
        </div>

        <div className="services__intro">
          <Reveal as="h2" className="h-1" y={40}>
            Шесть работ,
            <br />
            из которых <span className="italic-serif brass">складывается</span> газон
          </Reveal>
          <Reveal mode="fade" delay={180} className="services__note">
            <p className="body-s">
              Каждая работа имеет свой сезон и свою частоту. Мы не продаём аэрацию весной, если дёрн ещё не уплотнён,
              и не косим в дождь, потому что мокрый лист рвётся.
            </p>
          </Reveal>
        </div>

        <div className="services__grid">
          {SERVICES.map((s, i) => (
            <Card key={s.num} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
