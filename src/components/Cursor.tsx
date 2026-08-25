import { useEffect, useRef, useState } from 'react'
import { lerp } from '../lib/hooks'

/**
 * Курсор из двух частей: точка летит за мышью один-в-один,
 * кольцо догоняет с отставанием. Элементы с data-cursor="hover"
 * раздувают кольцо, data-cursor-label="текст" пишет подпись внутри.
 */
export function Cursor() {
  const wrap = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const w = wrap.current
    const d = dot.current
    const r = ring.current
    if (!(w && d && r)) {
      return
    }

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let raf = 0

    // Масштаб держим здесь же и вписываем внутрь transform.
    // Отдельное CSS-свойство scale применяется СНАРУЖИ transform и
    // домножает translate3d — кольцо уезжало к началу координат.
    let press = 1
    let pressTarget = 1
    let dotScale = 1
    let dotTarget = 1

    const tick = () => {
      rx = lerp(rx, mx, 0.16)
      ry = lerp(ry, my, 0.16)
      press = lerp(press, pressTarget, 0.22)
      dotScale = lerp(dotScale, dotTarget, 0.2)

      // scale стоит после translate: масштабирование идёт вокруг центра
      // самого элемента и его положения не меняет
      d.style.transform = `translate3d(${mx}px, ${my}px, 0) scale(${dotScale.toFixed(3)})`
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${press.toFixed(3)})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
      w.classList.remove('is-hidden')

      const el = (e.target as HTMLElement)?.closest?.(
        '[data-cursor], a, button, input, textarea, select, [role="button"]',
      ) as HTMLElement | null

      if (!el) {
        w.classList.remove('is-hover', 'is-drag', 'has-label')
        dotTarget = 1
        setLabel('')
        return
      }

      const kind = el.dataset.cursor
      const text = el.dataset.cursorLabel ?? ''
      w.classList.toggle('is-drag', kind === 'drag')
      w.classList.toggle('is-hover', kind !== 'drag')
      w.classList.toggle('has-label', Boolean(text))
      // Внутри раздутого кольца точка не нужна
      dotTarget = 0
      setLabel(text)
    }

    const onLeave = () => w.classList.add('is-hidden')
    const onDown = () => {
      pressTarget = 0.82
    }
    const onUp = () => {
      pressTarget = 1
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div className="cursor is-hidden" ref={wrap} aria-hidden="true">
      <div className="cursor__dot" ref={dot} />
      <div className="cursor__ring" ref={ring}>
        <span className="cursor__label">{label}</span>
      </div>
    </div>
  )
}
