import { useEffect, useId, useRef, useState } from 'react'

/**
 * Выпадающий список вместо нативного <select>.
 *
 * Нативный список рисует операционная система: на тёмной странице он
 * вываливается белой панелью с синим выделением и не поддаётся стилям.
 * Здесь список — обычная разметка, поэтому он в палитре сайта.
 *
 * Разметка следует шаблону combobox из ARIA APG: фокус остаётся на самом
 * поле, подсветку переносит aria-activedescendant, стрелки и Enter
 * работают как в родном контроле. Закрывается по Escape и по клику мимо.
 */
export function Select({
  value,
  options,
  onChange,
  label,
}: {
  value: string
  options: string[]
  onChange: (next: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => Math.max(0, options.indexOf(value)))
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLDivElement>(null)
  const id = useId()

  // Клик мимо закрывает список
  useEffect(() => {
    if (!open) {
      return
    }
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  const pick = (next: string) => {
    onChange(next)
    setActive(Math.max(0, options.indexOf(next)))
    setOpen(false)
    trigger.current?.focus()
  }

  const step = (delta: number) => {
    setActive((i) => (i + delta + options.length) % options.length)
  }

  /** Клавиши при раскрытом списке. */
  const onOpenKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(options[active])
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      step(e.key === 'ArrowDown' ? 1 : -1)
      return
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setActive(e.key === 'Home' ? 0 : options.length - 1)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (open) {
      onOpenKey(e)
      return
    }
    // Раскрываем теми же клавишами, что и нативный список
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className={`sel ${open ? 'is-open' : ''}`} ref={wrap}>
      <div
        className="sel__trigger"
        ref={trigger}
        role="combobox"
        tabIndex={0}
        aria-controls={`${id}-list`}
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        data-cursor="hover"
      >
        <span className="sel__value">{value}</span>
        <span className="sel__chevron" aria-hidden="true">
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4">
            <title>Раскрыть список</title>
            <path d="M3 4.5 6 8l3-3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {open ? (
        <div className="sel__list" id={`${id}-list`} role="listbox" aria-label={label}>
          {options.map((option, i) => (
            <div
              key={option}
              id={`${id}-${i}`}
              role="option"
              tabIndex={-1}
              aria-selected={option === value}
              className={`sel__option ${i === active ? 'is-active' : ''} ${option === value ? 'is-picked' : ''}`}
              // Курсор уводит фокус с поля раньше клика, поэтому выбираем на pointerdown
              onPointerDown={(e) => {
                e.preventDefault()
                pick(option)
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="sel__tick" aria-hidden="true" />
              {option}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
