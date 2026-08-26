import { useMemo, useState } from 'react'
import { CONTACTS, PRICING } from '../content'
import { clamp, fmt, useTilt } from '../lib/hooks'
import { Btn, Counter, Reveal } from './ui/primitives'

type Mode = 'once' | 'season'

function Plan({ p, mode, i }: { p: (typeof PRICING.plans)[number]; mode: Mode; i: number }) {
  const ref = useTilt<HTMLElement>(p.accent ? 5 : 7)
  const price = mode === 'season' ? p.priceSeason : p.priceOnce
  const custom = price === 0

  return (
    <Reveal mode="fade" delay={i * 130} className="plan-wrap">
      <article className={`plan ${p.accent ? 'is-accent' : ''}`} ref={ref} data-cursor="hover">
        <span className="plan__spot" aria-hidden="true" />
        {p.accent ? <span className="plan__aura" aria-hidden="true" /> : null}
        {'badge' in p && p.badge ? <span className="plan__badge mono">{p.badge}</span> : null}

        <header className="plan__head">
          <h3 className="plan__name">{p.name}</h3>
          <p className="plan__caption">{p.caption}</p>
        </header>

        <div className="plan__price">
          {custom ? (
            <span className="plan__price-custom italic-serif">по смете</span>
          ) : (
            <>
              <span className="plan__price-from mono dim">от</span>
              <b className={p.accent ? 'text-brass-grad' : ''} key={`${mode}-${price}`}>
                {fmt(price)}
              </b>
              <span className="plan__price-unit">{p.unit}</span>
            </>
          )}
          {mode === 'season' && !custom && <span className="plan__price-old">{fmt(p.priceOnce)} ₽</span>}
        </div>

        <p className="plan__note mono dim">{p.note}</p>

        <ul className="plan__feats">
          {p.features.map((f) => (
            <li key={f.t} className={f.on ? 'is-on' : 'is-off'}>
              <span className="plan__tick" aria-hidden="true">
                {f.on ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 14 14"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M2.5 7.4 5.6 10.5 11.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 14 14"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <path d="M3.5 7h7" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              {f.t}
            </li>
          ))}
        </ul>

        <Btn href={CONTACTS.telegram} variant={p.accent ? 'solid' : 'ghost'} className="plan__cta">
          {custom ? 'Запросить смету' : 'Выбрать тариф'}
        </Btn>
      </article>
    </Reveal>
  )
}

function Calculator({ mode }: { mode: Mode }) {
  const [area, setArea] = useState(8)
  const [freq, setFreq] = useState(PRICING.calc.freq[0].id)
  const [extras, setExtras] = useState<string[]>(['edge'])

  const base = mode === 'season' ? PRICING.plans[1].priceSeason : PRICING.plans[1].priceOnce
  const f = PRICING.calc.freq.find((x) => x.id === freq) ?? PRICING.calc.freq[0]

  const { perVisit, monthly, extrasSum } = useMemo(() => {
    const extrasPerSotka = PRICING.calc.extras
      .filter((e) => extras.includes(e.id))
      // Аэрация — разовая за сезон, в цену выезда не входит
      .filter((e) => e.id !== 'aer')
      .reduce((s, e) => s + e.price, 0)

    const pv = (base + extrasPerSotka) * area
    const seasonOnly = PRICING.calc.extras
      .filter((e) => extras.includes(e.id) && e.id === 'aer')
      .reduce((s, e) => s + e.price * area, 0)

    return { perVisit: pv, monthly: pv * f.mult + seasonOnly / 6, extrasSum: seasonOnly }
  }, [area, extras, base, f])

  const toggle = (id: string) =>
    setExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const pct = ((area - 2) / (40 - 2)) * 100

  return (
    <Reveal mode="fade" delay={120} className="calc">
      <div className="calc__head">
        <h3 className="h-2">{PRICING.calc.title}</h3>
        <p className="body-s">{PRICING.calc.lead}</p>
      </div>

      <div className="calc__body">
        <div className="calc__controls">
          {/* Площадь */}
          <div className="calc__row">
            <div className="calc__row-head">
              <span className="mono dim">Площадь участка</span>
              <span className="calc__area">
                <b>{area}</b> <em>соток</em>
              </span>
            </div>
            <div className="calc__slider" style={{ '--pct': `${pct}%` } as React.CSSProperties}>
              <input
                type="range"
                min={2}
                max={40}
                step={1}
                value={area}
                onChange={(e) => setArea(clamp(Number(e.target.value), 2, 40))}
                aria-label="Площадь участка в сотках"
              />
              <span className="calc__slider-track" aria-hidden="true">
                <span className="calc__slider-fill" />
              </span>
            </div>
            <div className="calc__ticks mono" aria-hidden="true">
              <span>2</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>

          {/* Частота */}
          <div className="calc__row">
            <span className="mono dim calc__row-label">Частота выездов</span>
            <div className="calc__freq">
              {PRICING.calc.freq.map((x) => (
                <button
                  type="button"
                  key={x.id}
                  className={`calc__chip ${freq === x.id ? 'is-on' : ''}`}
                  onClick={() => setFreq(x.id)}
                  data-cursor="hover"
                >
                  <span>{x.t}</span>
                  <em className="mono">{x.hint}</em>
                </button>
              ))}
            </div>
          </div>

          {/* Дополнительно */}
          <div className="calc__row">
            <span className="mono dim calc__row-label">Дополнительно</span>
            <div className="calc__extras">
              {PRICING.calc.extras.map((e) => (
                <button
                  type="button"
                  key={e.id}
                  className={`calc__extra ${extras.includes(e.id) ? 'is-on' : ''}`}
                  onClick={() => toggle(e.id)}
                  data-cursor="hover"
                >
                  <span className="calc__box" aria-hidden="true">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      width="11"
                      height="11"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2.5 7.4 5.6 10.5 11.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="calc__extra-t">{e.t}</span>
                  <span className="calc__extra-p mono">
                    +{fmt(e.price)} ₽/{e.per}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Итог */}
        <div className="calc__result">
          <span className="calc__result-glow" aria-hidden="true" />
          <div className="calc__result-block">
            <span className="mono dim">Один выезд</span>
            <b className="calc__big text-brass-grad">
              <Counter to={perVisit} suffix=" ₽" duration={700} key={`v-${perVisit}`} />
            </b>
          </div>

          <span className="calc__hr" aria-hidden="true" />

          <div className="calc__result-block">
            <span className="mono dim">В месяц · {f.t.toLowerCase()}</span>
            <b className="calc__mid">
              <Counter to={monthly} suffix=" ₽" duration={700} key={`m-${Math.round(monthly)}`} />
            </b>
          </div>

          {extrasSum > 0 && (
            <p className="calc__hint mono">
              включая аэрацию {fmt(extrasSum)} ₽ — разово за сезон, разнесено помесячно
            </p>
          )}

          <p className="calc__disclaimer body-s">
            Прикидка по тарифу ИМПЕРАТОР. Точная цена — после бесплатного замера: рельеф, препятствия и состояние
            дёрна могут её как поднять, так и опустить.
          </p>

          <Btn href={CONTACTS.telegram} variant="solid" className="calc__cta">
            Зафиксировать цену
          </Btn>
        </div>
      </div>
    </Reveal>
  )
}

export function Pricing() {
  const [mode, setMode] = useState<Mode>('season')

  return (
    <section className="section pricing" id="pricing">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">VII</span>
          <span className="sec-head__label">{PRICING.label}</span>
          <span className="sec-head__rule" />
        </div>

        <div className="pricing__top">
          <Reveal as="h2" className="h-1" y={44}>
            {PRICING.title}
          </Reveal>
          <Reveal mode="fade" delay={140}>
            <p className="lead pricing__lead">{PRICING.lead}</p>
          </Reveal>

          <Reveal mode="fade" delay={220}>
            <fieldset className="toggle">
              <legend className="sr-only">Режим оплаты</legend>
              <span
                className="toggle__pill"
                style={{ transform: `translateX(${mode === 'season' ? '100%' : '0'})` }}
                aria-hidden="true"
              />
              <button
                type="button"
                className={mode === 'once' ? 'is-on' : ''}
                onClick={() => setMode('once')}
                data-cursor="hover"
              >
                {PRICING.toggle.once}
              </button>
              <button
                type="button"
                className={mode === 'season' ? 'is-on' : ''}
                onClick={() => setMode('season')}
                data-cursor="hover"
              >
                {PRICING.toggle.season}
              </button>
            </fieldset>
          </Reveal>
        </div>

        <div className="pricing__grid">
          {PRICING.plans.map((p, i) => (
            <Plan key={p.id} p={p} mode={mode} i={i} />
          ))}
        </div>

        <Calculator mode={mode} />
      </div>
    </section>
  )
}
