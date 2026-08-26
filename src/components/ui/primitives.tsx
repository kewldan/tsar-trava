import { type ComponentPropsWithRef, type ElementType, type ReactNode, useMemo } from 'react'
import { fmt, useCountUp, useInView, useMagnetic } from '../../lib/hooks'

const WHITESPACE_SPLIT = /(\s+)/
const ONLY_WHITESPACE = /^\s+$/

/* ── Reveal: маска снизу вверх при появлении ─────────────── */

interface RevealProps {
  children: ReactNode
  delay?: number
  as?: ElementType
  className?: string
  y?: number
  /** 'mask' — вылет из-под маски, 'fade' — мягкое проявление, 'clip' — раскрытие шторкой */
  mode?: 'mask' | 'fade' | 'clip'
}

export function Reveal({ children, delay = 0, as = 'div', className = '', y = 26, mode = 'mask' }: RevealProps) {
  const [ref, seen] = useInView<HTMLDivElement>()
  // Полиморфный тег: без каста TS выводит props как never
  const Tag = as as unknown as ElementType<ComponentPropsWithRef<'div'>>
  return (
    <Tag
      ref={ref}
      className={`rv rv--${mode} ${seen ? 'is-in' : ''} ${className}`}
      style={{ '--rv-delay': `${delay}ms`, '--rv-y': `${y}px` } as React.CSSProperties}
    >
      {/* biome-ignore lint/suspicious/noLeakedRender: children — контракт React, а не условие; оборачивать их всегда нельзя, иначе ломается flex-раскладка у mode="fade" */}
      {mode === 'mask' ? <span className="rv__inner">{children}</span> : children}
    </Tag>
  )
}

/* ── SplitText: по буквам или по словам, каскадом ────────── */

export function SplitText({
  text,
  by = 'char',
  className = '',
  delay = 0,
  stagger = 22,
  as = 'span',
}: {
  text: string
  by?: 'char' | 'word'
  className?: string
  delay?: number
  stagger?: number
  as?: ElementType
}) {
  const [ref, seen] = useInView<HTMLSpanElement>({ threshold: 0.25 })
  const parts = useMemo(() => (by === 'char' ? Array.from(text) : text.split(WHITESPACE_SPLIT)), [text, by])
  const Tag = as as unknown as ElementType<ComponentPropsWithRef<'span'>>

  return (
    <Tag ref={ref} className={`split ${seen ? 'is-in' : ''} ${className}`} aria-label={text}>
      {parts.map((p, i) => {
        if (p === ' ' || ONLY_WHITESPACE.test(p)) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: разбиение фиксированной строки, символы повторяются и различимы только позицией
            <span key={i} className="split__space">
              &nbsp;
            </span>
          )
        }
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: тот же разбор строки — устойчивого ключа у символа нет
          <span key={i} className="split__box" aria-hidden="true">
            <span className="split__part" style={{ transitionDelay: `${delay + i * stagger}ms` }}>
              {p}
            </span>
          </span>
        )
      })}
    </Tag>
  )
}

/* ── Counter ─────────────────────────────────────────────── */

export function Counter({
  to,
  suffix = '',
  prefix = '',
  duration,
  className = '',
}: {
  to: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}) {
  const [ref, seen] = useInView<HTMLSpanElement>({ threshold: 0.15, rootMargin: '0px 0px -4% 0px' })
  const v = useCountUp(to, seen, duration)
  return (
    <span ref={ref} className={className}>
      {prefix}
      {fmt(v)}
      {suffix}
    </span>
  )
}

/* ── Magnetic wrapper ───────────────────────────────────── */

export function Magnetic({
  children,
  strength = 0.3,
  className = '',
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useMagnetic<HTMLSpanElement>(strength)
  return (
    <span ref={ref} className={`magnetic ${className}`}>
      {children}
    </span>
  )
}

/* ── Marquee: бесконечная лента ─────────────────────────── */

export function Marquee({
  items,
  speed = 40,
  reverse = false,
  separator = '✦',
  className = '',
}: {
  items: string[]
  speed?: number
  reverse?: boolean
  separator?: string
  className?: string
}) {
  const track = (key: string) => (
    <div className="marquee__track" key={key} aria-hidden={key === 'b'}>
      {items.map((t, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: лента статична и может содержать повторяющиеся подписи
        <span className="marquee__item" key={i}>
          <span>{t}</span>
          <i className="marquee__sep">{separator}</i>
        </span>
      ))}
    </div>
  )
  return (
    <div
      className={`marquee ${reverse ? 'marquee--rev' : ''} ${className}`}
      style={{ '--mq-dur': `${speed}s` } as React.CSSProperties}
    >
      {track('a')}
      {track('b')}
    </div>
  )
}

/* ── Кнопка со «шторкой» при наведении ──────────────────── */

export function Btn({
  children,
  href,
  onClick,
  variant = 'solid',
  className = '',
  arrow = true,
  type = 'button',
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'solid' | 'ghost' | 'line'
  className?: string
  arrow?: boolean
  type?: 'button' | 'submit'
}) {
  const inner = (
    <>
      <span className="btn__fill" aria-hidden="true" />
      <span className="btn__label">
        <span className="btn__label-a">{children}</span>
        <span className="btn__label-b" aria-hidden="true">
          {children}
        </span>
      </span>
      {arrow ? (
        <span className="btn__arrow" aria-hidden="true">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
    </>
  )

  const cls = `btn btn--${variant} ${className}`

  if (href) {
    const ext = href.startsWith('http')
    return (
      <Magnetic strength={0.24}>
        <a
          className={cls}
          href={href}
          target={ext ? '_blank' : undefined}
          rel={ext ? 'noreferrer' : undefined}
          data-cursor="hover"
        >
          {inner}
        </a>
      </Magnetic>
    )
  }
  return (
    <Magnetic strength={0.24}>
      <button className={cls} onClick={onClick} type={type} data-cursor="hover">
        {inner}
      </button>
    </Magnetic>
  )
}

/* ── Церемониальный разделитель секций ──────────────────── */

/**
 * Заменяет простую линейку между секциями: две латунные нити, ромбы
 * и монограмма посередине. Появляется семь раз за страницу и задаёт
 * ритм «устава», а не лендинга.
 */
export function Ornament() {
  return (
    <div className="ornament shell" aria-hidden="true">
      <span className="ornament__rule" />
      <span className="ornament__lozenge" />
      <span className="ornament__mark">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
          <title>Монограмма ЦГ</title>
          <path d="M16 26V13" strokeLinecap="round" />
          <path d="M16 13c0-3.2 2.7-5.4 6.5-6 .6 3.7-1.7 7-6.5 6Z" strokeLinejoin="round" />
          <path d="M16 17.2c0-2.8-2.3-4.7-5.6-5.1-.5 3.2 1.4 6 5.6 5.1Z" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="ornament__lozenge" />
      <span className="ornament__rule" />
    </div>
  )
}
