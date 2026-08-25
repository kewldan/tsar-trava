import { Suspense, lazy, useEffect, useRef, useState, useCallback } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { Preloader } from './components/Preloader'
import { Cursor } from './components/Cursor'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Manifesto } from './components/Manifesto'
import { Services } from './components/Services'
import { Territory } from './components/Territory'
import { Process } from './components/Process'
import { Equipment } from './components/Equipment'
import { BeforeAfter } from './components/BeforeAfter'
import { Team } from './components/Team'
import { Pricing } from './components/Pricing'
import { Testimonials } from './components/Testimonials'
import { Faq } from './components/Faq'
import { Cta } from './components/Cta'
import { Footer } from './components/Footer'
import { useReducedMotion } from './lib/hooks'

const GrassScene = lazy(() => import('./three/GrassScene').then((m) => ({ default: m.GrassScene })))

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [ready, setReady] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  // Сцена видна только на первом экране — ниже держать её живой незачем
  const [sceneActive, setSceneActive] = useState(true)
  // Прогресс первого экрана, отдаём в 3D — там от него зависит камера
  const heroProgress = useRef(0)
  const reduced = useReducedMotion()

  /* Плавный скролл + связка с ScrollTrigger */
  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
      lerp: 0.09,
    })
    ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      delete (window as unknown as { __lenis?: Lenis }).__lenis
    }
  }, [reduced])

  /* Прогресс героя — считаем один раз на кадр и кладём в ref */
  useEffect(() => {
    let raf = 0
    const on = () => {
      if (raf) return
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
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const onLoaded = useCallback(() => setReady(true), [])
  const onSceneReady = useCallback(() => setSceneReady(true), [])

  useEffect(() => {
    if (!ready) return
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
          <div className="hairline shell" />
          <Services />
          <div className="hairline shell" />
          <Territory />
          <Process />
          <div className="hairline shell" />
          <Equipment />
          <div className="hairline shell" />
          <BeforeAfter />
          <div className="hairline shell" />
          <Team />
          <div className="hairline shell" />
          <Pricing />
          <Testimonials />
          <div className="hairline shell" />
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
