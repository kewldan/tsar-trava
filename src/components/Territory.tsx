import { useState } from 'react'
import { CONTACTS, TERRITORY } from '../content'
import { OsmMap } from './OsmMap'
import { Btn, Counter, Reveal } from './ui/primitives'

export function Territory() {
  const [hover, setHover] = useState<string | null>(null)

  return (
    <section className="section terr" id="territory">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">III</span>
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
                {/* biome-ignore lint/a11y/noStaticElementInteractions: подсветка зоны на карте — визуальное дополнение, весь текст карточки доступен и без неё */}
                {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: то же самое — своей функциональности у наведения нет */}
                <div
                  className="terr__card-in"
                  onMouseEnter={() => setHover(z.name)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(z.name)}
                  onBlur={() => setHover(null)}
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
