import { BRAND, CONTACTS, FOOTER } from '../content'
import { useScrollTo } from '../lib/hooks'
import { Magnetic, Reveal } from './ui/primitives'

export function Footer() {
  const scrollTo = useScrollTo()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <span className="footer__aura" aria-hidden="true" />

      <div className="shell">
        <Reveal className="footer__mega" y={60}>
          {/* textLength растягивает надпись точно по ширине блока —
              никакого подбора font-size под каждый брейкпоинт */}
          <svg
            className="footer__mega-svg"
            viewBox="0 0 1000 150"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={BRAND.name}
          >
            <defs>
              <linearGradient id="footer-mega" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(242,240,234,0.5)" />
                <stop offset="100%" stopColor="rgba(242,240,234,0.05)" />
              </linearGradient>
            </defs>
            <text
              x="500"
              y="122"
              textAnchor="middle"
              textLength="990"
              lengthAdjust="spacingAndGlyphs"
              fill="url(#footer-mega)"
            >
              {BRAND.name}
            </text>
          </svg>
        </Reveal>

        <div className="footer__grid">
          <div className="footer__brand">
            <p className="footer__tagline italic-serif">
              «Через сезон участок перестаёт быть участком и становится видом.»
            </p>
            <div className="footer__contact">
              <Magnetic strength={0.2}>
                <a
                  className="footer__tg"
                  href={CONTACTS.telegram}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="hover"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M21.9 4.3 18.9 20c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.5.5-.9.5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7.4 13.2 2.9 11.8c-1-.3-1-1 .2-1.5l17.5-6.7c.8-.3 1.5.2 1.3 1.7Z" />
                  </svg>
                  {CONTACTS.telegramHandle}
                </a>
              </Magnetic>
              <a className="footer__mail" href={`mailto:${CONTACTS.email}`} data-cursor="hover">
                {CONTACTS.email}
              </a>
              <span className="mono dim">{CONTACTS.hours}</span>
            </div>
          </div>

          {FOOTER.columns.map((c) => (
            <nav className="footer__col" key={c.t} aria-label={c.t}>
              <h4 className="mono brass">{c.t}</h4>
              <ul>
                {c.links.map((l) => (
                  <li key={`${l.to}-${l.label}`}>
                    <button type="button" onClick={() => scrollTo(l.to)} data-cursor="hover">
                      <span>{l.label}</span>
                      <i aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer__bottom">
          <span className="mono dim">
            © {year} {BRAND.name} · {BRAND.geo}
          </span>
          <span className="mono dim">{FOOTER.legal}</span>
          <button
            type="button"
            className="footer__up mono"
            onClick={() => {
              const l = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis
              if (l) {
                l.scrollTo(0, { duration: 1.6 })
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            data-cursor="hover"
          >
            наверх
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M8 13V3M4 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  )
}
