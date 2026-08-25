import { useState } from 'react'
import { TERRITORY, CONTACTS } from '../content'
import { Reveal, Counter, Btn } from './ui/Primitives'
import { OsmMap } from './OsmMap'

export function Territory() {
  const [hover, setHover] = useState<string | null>(null)

  return (
    <section className="section terr" id="territory">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">03</span>
          <span className="sec-head__label">{TERRITORY.label}</span>
          <span className="sec-head__rule" />
        </div>

        <div className="terr__top">
          <Reveal as="h2" className="h-1" y={44}>
            {TERRITORY.title}
          </Reveal>
          <Reveal mode="fade" delay={160}>
            <p className="lead terr__lead">{TERRITORY.lead}</p>
          </Reveal>
        </div>

        <div className="terr__body">
          <OsmMap hover={hover} />

          <div className="terr__zones">
            {TERRITORY.zones.map((z, i) => (
              <Reveal
                key={z.name}
                mode="fade"
                delay={i * 130}
                className={`terr__card ${z.accent ? 'is-accent' : ''}`}
              >
                <div
                  onMouseEnter={() => setHover(z.name)}
                  onMouseLeave={() => setHover(null)}
                  className="terr__card-in"
                  data-cursor="hover"
                >
                  <div className="terr__card-head">
                    <h3 className="h-2">{z.name}</h3>
                    <span className="mono dim">{z.code}</span>
                  </div>
                  <p className="body-s">{z.d}</p>
                  <div className="terr__card-nums">
                    <div>
                      <b>
                        <Counter to={z.plots} />
                      </b>
                      <span className="mono dim">участков</span>
                    </div>
                    <div>
                      <b>{z.travel}</b>
                      <span className="mono dim">подъезд</span>
                    </div>
                  </div>
                  <span className="terr__card-line" aria-hidden="true" />
                </div>
              </Reveal>
            ))}

            <Reveal mode="fade" delay={280} className="terr__outside">
              <span className="mono brass">За пределами</span>
              <p className="body-s">{TERRITORY.outside}</p>
              <Btn href={CONTACTS.telegram} variant="line">
                Спросить про свой адрес
              </Btn>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
