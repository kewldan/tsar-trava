import { useState } from 'react'
import { CONTACTS, CTA, PRICING, TERRITORY } from '../content'
import { Btn, Reveal } from './ui/primitives'
import { Select } from './ui/Select'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function Cta() {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    address: TERRITORY.zones[0].name,
    area: '',
    plan: PRICING.plans[1].name,
    note: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [touched, setTouched] = useState(false)

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid = form.name.trim().length > 1 && form.contact.trim().length > 2

  const compose = () =>
    [
      'Заявка с сайта ЦАРСКИЙ ГАЗОН',
      `Имя: ${form.name}`,
      `Связь: ${form.contact}`,
      `Адрес: ${form.address}`,
      form.area && `Площадь: ${form.area} соток`,
      `Тариф: ${form.plan}`,
      form.note && `Комментарий: ${form.note}`,
    ]
      .filter(Boolean)
      .join('\n')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) {
      return
    }

    setStatus('sending')
    const text = compose()

    // Бэкенда на GitHub Pages нет. Если появится formEndpoint — шлём POST,
    // иначе кладём готовое сообщение в буфер и открываем Telegram.
    if (CONTACTS.formEndpoint) {
      try {
        const res = await fetch(CONTACTS.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, text }),
        })
        setStatus(res.ok ? 'sent' : 'error')
        return
      } catch {
        setStatus('error')
        return
      }
    }

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Буфер может быть недоступен — не повод ломать сценарий
    }
    window.open(CONTACTS.telegram, '_blank', 'noopener')
    setStatus('sent')
  }

  return (
    <section className="section cta" id="cta">
      <span className="cta__aura" aria-hidden="true" />
      <div className="shell">
        <div className="sec-head">
          <span className="sec-head__num">IX</span>
          <span className="sec-head__label">{CTA.label}</span>
          <span className="sec-head__rule" />
        </div>

        <div className="cta__grid">
          <div className="cta__left">
            <Reveal as="h2" className="h-1" y={46}>
              {CTA.title}
            </Reveal>
            <Reveal mode="fade" delay={140}>
              <p className="lead cta__lead">{CTA.lead}</p>
            </Reveal>

            <ul className="cta__benefits">
              {CTA.benefits.map((b, i) => (
                <Reveal key={b} as="li" mode="fade" delay={200 + i * 100}>
                  <span className="cta__check" aria-hidden="true">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M2.5 7.4 5.6 10.5 11.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {b}
                </Reveal>
              ))}
            </ul>

            <Reveal mode="fade" delay={520} className="cta__direct">
              <span className="mono dim">Или сразу напрямую</span>
              <div className="cta__direct-links">
                <Btn href={CONTACTS.telegram} variant="ghost">
                  {CONTACTS.telegramHandle}
                </Btn>
                <span className="mono dim">{CONTACTS.hours}</span>
              </div>
            </Reveal>
          </div>

          <Reveal mode="fade" delay={160} className="cta__right">
            <form className={`form ${status === 'sent' ? 'is-sent' : ''}`} onSubmit={submit} noValidate={true}>
              <div className="form__rows">
                <label className={`field ${touched && form.name.trim().length < 2 ? 'is-bad' : ''}`}>
                  <span className="field__label mono">Как к вам обращаться</span>
                  <input value={form.name} onChange={set('name')} placeholder="Имя" autoComplete="name" />
                  <span className="field__line" aria-hidden="true" />
                </label>

                <label className={`field ${touched && form.contact.trim().length < 3 ? 'is-bad' : ''}`}>
                  <span className="field__label mono">Telegram или телефон</span>
                  <input
                    value={form.contact}
                    onChange={set('contact')}
                    placeholder="@username или +7…"
                    autoComplete="tel"
                  />
                  <span className="field__line" aria-hidden="true" />
                </label>

                <div className="form__pair">
                  <div className="field">
                    <span className="field__label mono">Адрес</span>
                    <Select
                      label="Адрес"
                      value={form.address}
                      options={[...TERRITORY.zones.map((z) => z.name), 'Другой адрес']}
                      onChange={(address) => setForm((f) => ({ ...f, address }))}
                    />
                  </div>

                  <label className="field">
                    <span className="field__label mono">Площадь, соток</span>
                    <input value={form.area} onChange={set('area')} placeholder="8" inputMode="numeric" />
                    <span className="field__line" aria-hidden="true" />
                  </label>
                </div>

                <div className="field">
                  <span className="field__label mono">Тариф</span>
                  <div className="form__chips">
                    {PRICING.plans.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`form__chip ${form.plan === p.name ? 'is-on' : ''}`}
                        onClick={() => setForm((f) => ({ ...f, plan: p.name }))}
                        data-cursor="hover"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field">
                  <span className="field__label mono">Что важно знать заранее</span>
                  <textarea
                    value={form.note}
                    onChange={set('note')}
                    rows={3}
                    placeholder="Собака во дворе, крутой склон, спрятанный люк…"
                  />
                  <span className="field__line" aria-hidden="true" />
                </label>
              </div>

              <div className="form__foot">
                <Btn type="submit" variant="solid" className="form__submit">
                  {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
                </Btn>
                <span className="form__legal mono">
                  Нажимая, вы соглашаетесь на обработку контактов ради одного ответа. Рассылок нет.
                </span>
              </div>

              {status === 'sent' && (
                <div className="form__done" role="status">
                  <b>Готово.</b>
                  <span>
                    {CONTACTS.formEndpoint
                      ? 'Заявка ушла. Ответим в течение получаса в рабочие часы.'
                      : 'Текст заявки скопирован в буфер и открыт Telegram — вставьте сообщение и отправьте.'}
                  </span>
                </div>
              )}
              {status === 'error' && (
                <div className="form__done form__done--bad" role="status">
                  <b>Не ушло.</b>
                  <span>
                    Напишите напрямую в{' '}
                    <a href={CONTACTS.telegram} target="_blank" rel="noreferrer">
                      {CONTACTS.telegramHandle}
                    </a>
                    .
                  </span>
                </div>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
