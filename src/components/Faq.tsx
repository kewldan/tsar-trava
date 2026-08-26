import { useState } from 'react'
import { CONTACTS, FAQ } from '../content'
import { Btn, Reveal } from './ui/primitives'

function Item({ q, a, i, open, onToggle }: { q: string; a: string; i: number; open: boolean; onToggle: () => void }) {
  return (
    <Reveal mode="fade" delay={i * 55} className="faq__item-wrap">
      <div className={`faq__item ${open ? 'is-open' : ''}`}>
        <button type="button" className="faq__q" onClick={onToggle} aria-expanded={open} data-cursor="hover">
          <span className="faq__num mono">{String(i + 1).padStart(2, '0')}</span>
          <span className="faq__q-text">{q}</span>
          <span className="faq__sign" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="faq__hover" aria-hidden="true" />
        </button>
        <div className="faq__a">
          <div className="faq__a-in">
            <p>{a}</p>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="section faq" id="faq">
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">VIII</span>
          <span className="sec-head__label">Вопросы</span>
          <span className="sec-head__rule" />
        </div>

        <div className="faq__grid">
          <div className="faq__side">
            <Reveal as="h2" className="h-1" y={44}>
              Десять вопросов,
              <br />
              которые <span className="italic-serif brass">задают всегда</span>
            </Reveal>
            <Reveal mode="fade" delay={160}>
              <p className="body-s faq__side-note">
                Если вашего вопроса здесь нет — напишите. Отвечаем сами, без скриптов, и честно говорим, когда работа
                вам не нужна.
              </p>
            </Reveal>
            <Reveal mode="fade" delay={240}>
              <Btn href={CONTACTS.telegram} variant="ghost">
                Задать свой вопрос
              </Btn>
            </Reveal>
          </div>

          <div className="faq__list">
            {FAQ.map((f, i) => (
              <Item
                key={f.q}
                q={f.q}
                a={f.a}
                i={i}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
