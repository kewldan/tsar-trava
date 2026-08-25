import { useState } from 'react'
import { CONTACTS, TEAM } from '../content'
import { asset, useTilt } from '../lib/hooks'
import { Btn, Reveal } from './ui/primitives'

function Member({ m, i }: { m: (typeof TEAM)[number]; i: number }) {
  const ref = useTilt<HTMLElement>(6)
  const [open, setOpen] = useState(false)

  return (
    <Reveal mode="fade" delay={i * 140} className="team__cell">
      <article className={`member ${open ? 'is-open' : ''}`} ref={ref}>
        <div className="member__frame">
          <img
            className="member__photo"
            src={asset(m.photo)}
            alt={`${m.name} — ${m.role}`}
            loading="lazy"
            width={600}
            height={800}
          />
          <span className="member__scrim" aria-hidden="true" />
          <span className="member__stripes" aria-hidden="true" />

          <span className="member__since mono">с {m.since}</span>

          <div className="member__quote">
            <span aria-hidden="true">«</span>
            {m.quote}
            <span aria-hidden="true">»</span>
          </div>

          <div className="member__panel">
            <div className="member__stats">
              {m.stats.map((s) => (
                <div key={s.k}>
                  <span className="mono dim">{s.k}</span>
                  <b>{s.v}</b>
                </div>
              ))}
            </div>
            <ul className="member__skills">
              {m.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="member__foot">
          <div>
            <h3 className="member__name h-3">{m.name}</h3>
            <span className="member__role mono brass">{m.role}</span>
          </div>
          <button
            type="button"
            className="member__toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`${open ? 'Свернуть' : 'Показать'} подробности: ${m.name}`}
            data-cursor="hover"
            data-cursor-label={open ? 'свернуть' : 'подробнее'}
          >
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </button>
        </footer>
      </article>
    </Reveal>
  )
}

export function Team() {
  return (
    <section className="section team" id="team">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">06</span>
          <span className="sec-head__label">Мастера</span>
          <span className="sec-head__rule" />
        </div>

        <div className="team__top">
          <Reveal as="h2" className="h-1" y={44}>
            Три человека.
            <br />
            Не <span className="italic-serif brass">«бригада»</span>, не подрядчики
          </Reveal>
          <Reveal mode="fade" delay={160}>
            <p className="lead team__lead">
              За вашим адресом закреплён конкретный мастер — он приезжает весь сезон и помнит ваш участок лучше, чем
              вы сами. Ниже — все, кто вообще может к вам приехать. Больше никого нет.
            </p>
          </Reveal>
        </div>

        <div className="team__grid">
          {TEAM.map((m, i) => (
            <Member key={m.id} m={m} i={i} />
          ))}
        </div>

        <Reveal mode="fade" delay={200} className="team__note">
          <p className="body-s">
            Штат не растёт намеренно. Четвёртый мастер — это либо расширение географии, либо падение качества; мы
            выбрали первое не делать.
          </p>
          <Btn href={CONTACTS.telegram} variant="line">
            Узнать, кто закреплён за вашим адресом
          </Btn>
        </Reveal>
      </div>
    </section>
  )
}
