import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { BeforeAfter } from './components/BeforeAfter'
import { Cta } from './components/Cta'
import { Cursor } from './components/Cursor'
import { Equipment } from './components/Equipment'
import { Faq } from './components/Faq'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Manifesto } from './components/Manifesto'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { Pricing } from './components/Pricing'
import { Process } from './components/Process'
import { Services } from './components/Services'
import { Team } from './components/Team'
import { Territory } from './components/Territory'
import { Testimonials } from './components/Testimonials'
import { Ornament } from './components/ui/primitives'
import { useReducedMotion } from './lib/hooks'

const GrassScene = lazy(() => import('./three/GrassScene').then((m) => ({ default: m.GrassScene })))

gsap.registerPlugin(ScrollTrigger)

/**
 * Экземпляр Lenis кладётся на window, чтобы до него могли дотянуться
 * обработчики переходов к секциям, не протаскивая его через пропсы.
 */
const lenisHost = () => window as unknown as { __lenis?: Lenis }

export function App() {
  const [ready, setReady] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  // Сцена видна только на первом экране — ниже держать её живой незачем
  const [sceneActive, setSceneActive] = useState(true)
  // Прогресс первого экрана, отдаём в 3D — там от него зависит камера
  const heroProgress = useRef(0)
  const reduced = useReducedMotion()

  /* Плавный скролл + связка с ScrollTrigger */
  useEffect(() => {
    if (reduced) {
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
      lerp: 0.09,
    })

    lenisHost().__lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisHost().__lenis = undefined
    }
  }, [reduced])

  /* Прогресс героя — считаем один раз на кадр и кладём в ref */
  useEffect(() => {
    let raf = 0
    const on = () => {
      if (raf) {
        return
      }
      raf = requestAnimationFrame(() => {
        const vh = Math.max(1, window.innerHeight)
        heroProgress.current = Math.min(1, window.scrollY / vh)
        setSceneActive(window.scrollY < vh * 1.35)
        raf = 0
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      window.removeEventListener('scroll', on)
      if (raf) {
        cancelAnimationFrame(raf)
      }
    }
  }, [])

  const onLoaded = useCallback(() => setReady(true), [])
  const onSceneReady = useCallback(() => setSceneReady(true), [])

  useEffect(() => {
    if (!ready) {
      return
    }
    const t = setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => clearTimeout(t)
  }, [ready])

  return (
    <>
      <Preloader sceneReady={sceneReady || reduced} onDone={onLoaded} />
      <Cursor />

      {/* Сцена монтируется сразу под прелоадером: шейдеры компилируются,
          пока пользователь смотрит на полосу загрузки */}
      <div className={`scene ${ready ? 'is-live' : ''}`} aria-hidden="true">
        <Suspense fallback={null}>
          <GrassScene scrollRef={heroProgress} active={sceneActive} onReady={onSceneReady} />
        </Suspense>
      </div>
      <div className="scene__veil" aria-hidden="true" />

      <Nav />

      <main className="page">
        <Hero ready={ready} />

        {/* Всё, что ниже героя, лежит на непрозрачной подложке — WebGL остаётся только вверху */}
        <div className="page__body">
          <Manifesto />
          <Ornament />
          <Services />
          <Ornament />
          <Territory />
          <Process />
          <Ornament />
          <Equipment />
          <Ornament />
          <BeforeAfter />
          <Ornament />
          <Team />
          <Ornament />
          <Pricing />
          <Testimonials />
          <Ornament />
          <Faq />
          <Cta />
        </div>
      </main>

      <Footer />

      <div className="grain-fixed" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  )
}
