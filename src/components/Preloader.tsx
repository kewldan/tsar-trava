import { useEffect, useRef, useState } from 'react'
import { BRAND } from '../content'

const LINES = ['ЗАТАЧИВАЕМ НОЖИ', 'НАТЯГИВАЕМ ШНУР', 'ВЫСТАВЛЯЕМ ВЫСОТУ СРЕЗА', 'СЕЕМ ПОЛЕ', 'ЗАПУСКАЕМ ДВИГАТЕЛЬ']

/**
 * Прелоадер не крутится по таймеру, а ждёт реальных событий:
 * шрифты → монтирование сцены → первый отрисованный кадр WebGL.
 * Поэтому под ним успевают скомпилироваться шейдеры и собраться
 * 40–70 тысяч инстансов травы, и страница открывается без рывка.
 */
export function Preloader({
  fontsWeight = 0.2,
  sceneReady,
  onDone,
}: {
  fontsWeight?: number
  /** true — WebGL отрисовал первый кадр */
  sceneReady: boolean
  onDone: () => void
}) {
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)

  const fontsDone = useRef(false)
  const startedAt = useRef(0)

  useEffect(() => {
    document.fonts?.ready
      .then(() => {
        fontsDone.current = true
      })
      .catch(() => {
        fontsDone.current = true
      })
    // Даже если шрифты молчат — не держим экран дольше 2,5 с
    const t = setTimeout(() => {
      fontsDone.current = true
    }, 2500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let raf = 0
    let v = 0

    const step = (t: number) => {
      if (!startedAt.current) startedAt.current = t
      const elapsed = t - startedAt.current

      // Целевой прогресс складывается из реальных вех, а не из таймера.
      // Ползучая добавка нужна, чтобы полоса не замирала намертво.
      let target = 8 + Math.min(20, elapsed / 60)
      if (fontsDone.current) target = Math.max(target, 30 + fontsWeight * 100)
      if (sceneReady) target = 100

      v += (target - v) * (sceneReady ? 0.16 : 0.06)
      setPct(v)

      if (sceneReady && v > 99.2) {
        setPct(100)
        setDone(true)
        return
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [sceneReady, fontsWeight])

  // Страховка: даже если WebGL не поднялся (нет GPU, отключён) — пускаем через 6 с
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 6000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!done) return
    const a = setTimeout(onDone, 240)
    const b = setTimeout(() => setGone(true), 1700)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [done, onDone])

  const lineIdx = Math.min(LINES.length - 1, Math.floor((pct / 100) * LINES.length))

  return (
    <div
      className={`preloader ${done ? 'is-done' : ''}`}
      style={gone ? { opacity: 0, visibility: 'hidden' } : undefined}
      aria-hidden={done}
    >
      <div className="preloader__blades" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="preloader__blade" style={{ transitionDelay: `${i * 42}ms` }} />
        ))}
      </div>

      <div className="preloader__inner">
        <div className="preloader__mark text-brass-grad">{BRAND.name}</div>
        <div className="preloader__sub">{BRAND.geo}</div>
        <div className="preloader__bar">
          <div className="preloader__fill" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <div className="preloader__pct">{String(Math.round(pct)).padStart(3, '0')} / 100</div>
      </div>

      <div className="preloader__hint">{LINES[lineIdx]}</div>
    </div>
  )
}
