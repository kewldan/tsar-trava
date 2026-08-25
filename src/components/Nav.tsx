import { useEffect, useState, useMemo } from 'react'
import { BRAND, NAV, CONTACTS } from '../content'
import { useScrollProgress, useActiveSection, useScrollTo } from '../lib/hooks'
import { Btn, Magnetic } from './ui/Primitives'

function Mark() {
  return (
    <svg className="nav__mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 27V12" strokeLinecap="round" />
      <path d="M16 12c0-3.4 2.9-5.8 7-6.4.6 4-1.8 7.5-7 6.4Z" strokeLinejoin="round" />
      <path d="M16 16.5c0-3-2.5-5-6-5.5-.5 3.4 1.5 6.4 6 5.5Z" strokeLinejoin="round" />
      <path d="M6 27h20" strokeLinecap="round" opacity=".45" />
    </svg>
  )
}

export function Nav() {
  const [stuck, setStuck] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const progress = useScrollProgress()
  const ids = useMemo(() => NAV.map((n) => n.id), [])
  const active = useActiveSection(ids)
  const scrollTo = useScrollTo()

  useEffect(() => {
    let last = window.scrollY
    const on = () => {
      const y = window.scrollY
      setStuck(y > 40)
      // Прячем шапку при движении вниз, возвращаем при движении вверх
      setHidden(y > 380 && y > last && y - last > 4)
      last = y
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('is-locked', open)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    // Даём меню схлопнуться, потом уезжаем
    setTimeout(() => scrollTo(id), open ? 380 : 0)
  }

  const R = 15
  const CIRC = 2 * Math.PI * R

  return (
    <>
      <header className={`nav ${stuck ? 'is-stuck' : ''} ${hidden && !open ? 'is-hidden' : ''}`}>
        <div className="nav__inner">
          <a
            className="nav__brand"
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              const l = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis
              if (l) l.scrollTo(0, { duration: 1.4 })
              else window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            data-cursor="hover"
          >
            <Mark />
            <span className="nav__brand-text">
              <span className="nav__brand-name">{BRAND.name}</span>
              <span className="nav__brand-sub">{BRAND.tagline}</span>
            </span>
          </a>

          <nav className="nav__links" aria-label="Разделы">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={`nav__link ${active === n.id ? 'is-active' : ''}`}
                onClick={() => go(n.id)}
                data-cursor="hover"
              >
                {n.label}
                <sup>{n.num}</sup>
              </button>
            ))}
          </nav>

          <div className="nav__right">
            <div className="nav__progress" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 34 34">
                <circle className="bg" cx="17" cy="17" r={R} />
                <circle
                  className="fg"
                  cx="17"
                  cy="17"
                  r={R}
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                />
              </svg>
              <span>{Math.round(progress * 100)}</span>
            </div>

            <Btn href={CONTACTS.telegram} variant="solid" className="nav__cta" arrow={false}>
              Заявка
            </Btn>

            <Magnetic strength={0.2}>
              <button
                className={`nav__burger ${open ? 'is-open' : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={open}
                data-cursor="hover"
              >
                <i />
                <i />
                <i />
              </button>
            </Magnetic>
          </div>
        </div>
      </header>

      <div className={`menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <ul className="menu__list">
          {NAV.map((n, i) => (
            <li className="menu__item" key={n.id}>
              <button
                className="menu__link"
                style={{ transitionDelay: `${open ? 120 + i * 55 : 0}ms` }}
                onClick={() => go(n.id)}
                tabIndex={open ? 0 : -1}
              >
                <em>{n.num}</em>
                {n.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="menu__foot">
          <Btn href={CONTACTS.telegram} variant="solid">
            Написать в Telegram
          </Btn>
          <span className="mono dim">{CONTACTS.hours}</span>
        </div>
      </div>
    </>
  )
}
