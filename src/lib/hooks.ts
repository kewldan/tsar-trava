import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU')

/** Путь до файла в /public с учётом base для GitHub Pages. */
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

/** Уважаем системную настройку «меньше движения». */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/** Появление элемента во вьюпорте — один раз, через IntersectionObserver. */
export function useInView<T extends HTMLElement>(
  opts: { threshold?: number; rootMargin?: string; once?: boolean } = {},
): [RefObject<T | null>, boolean] {
  const { threshold = 0.18, rootMargin = '0px 0px -8% 0px', once = true } = opts
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          if (once) io.disconnect()
        } else if (!once) {
          setSeen(false)
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, seen]
}

/** Магнитное притягивание элемента к курсору. */
export function useMagnetic<T extends HTMLElement>(strength = 0.32, radius = 90) {
  const ref = useRef<T>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (window.matchMedia('(hover: none)').matches) return

    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let active = false

    const tick = () => {
      cx = lerp(cx, tx, 0.16)
      cy = lerp(cy, ty, 0.16)
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
      if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05 || active) {
        raf = requestAnimationFrame(tick)
      } else {
        el.style.transform = ''
        raf = 0
      }
    }

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy)
      if (dist < Math.max(r.width, r.height) / 2 + radius) {
        active = true
        tx = dx * strength
        ty = dy * strength
        el.dataset.magnetic = 'on'
      } else if (active) {
        active = false
        tx = 0
        ty = 0
        delete el.dataset.magnetic
      }
      start()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
      el.style.transform = ''
    }
  }, [strength, radius, reduced])

  return ref
}

/** 3D-наклон карточки + позиция «блика» в CSS-переменных. */
export function useTilt<T extends HTMLElement>(max = 9) {
  const ref = useRef<T>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (window.matchMedia('(hover: none)').matches) return

    let raf = 0
    let trx = 0
    let try_ = 0
    let crx = 0
    let cry = 0

    const tick = () => {
      crx = lerp(crx, trx, 0.14)
      cry = lerp(cry, try_, 0.14)
      el.style.setProperty('--rx', `${crx.toFixed(3)}deg`)
      el.style.setProperty('--ry', `${cry.toFixed(3)}deg`)
      if (Math.abs(crx - trx) > 0.01 || Math.abs(cry - try_) > 0.01) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      trx = (0.5 - py) * max * 2
      try_ = (px - 0.5) * max * 2
      el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`)
      el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`)
      start()
    }
    const onLeave = () => {
      trx = 0
      try_ = 0
      start()
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [max, reduced])

  return ref
}

/** Счётчик с easing, стартует при появлении. */
export function useCountUp(target: number, active: boolean, duration = 1900) {
  const [value, setValue] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!active) return
    if (reduced) {
      setValue(target)
      return
    }
    let raf = 0
    let t0 = 0
    const step = (t: number) => {
      if (!t0) t0 = t
      const p = clamp((t - t0) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setValue(target * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration, reduced])

  return value
}

/** Прогресс прокрутки страницы 0..1 */
export function useScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const on = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        setP(max > 0 ? clamp(window.scrollY / max, 0, 1) : 0)
        raf = 0
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return p
}

/** Какая секция сейчас в фокусе — для подсветки в навигации. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-42% 0px -50% 0px', threshold: [0, 0.2, 0.5, 1] },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ids])
  return active
}

/** Мягкий переход к секции через Lenis (или нативно, если Lenis не поднялся). */
export function useScrollTo() {
  return useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__lenis
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.35 })
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
}
