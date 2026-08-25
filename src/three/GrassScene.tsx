import { useMemo, useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GRASS_VERT, GRASS_FRAG, GROUND_VERT, GROUND_FRAG, POLLEN_VERT, POLLEN_FRAG } from './grassShaders'
import { lerp, useReducedMotion } from '../lib/hooks'

const C = {
  root: new THREE.Color('#06180e'),
  mid: new THREE.Color('#1f5c3a'),
  tip: new THREE.Color('#3f9a63'),
  brass: new THREE.Color('#c8a96a'),
  fog: new THREE.Color('#070b08'),
  groundDark: new THREE.Color('#050a07'),
  groundLit: new THREE.Color('#0d2618'),
  pollen: new THREE.Color('#d8c48c'),
}

const STRIPE_ANGLE = Math.PI * 0.28 // диагональ покоса
const STRIPE_FREQ = 2.7
const FIELD_R = 13

/* ── Поле травы ─────────────────────────────────────────── */

function GrassField({ count, scrollRef }: { count: number; scrollRef: React.RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const mouseWorld = useRef(new THREE.Vector3(0, 0, 0))
  const mouseForce = useRef(0)
  const targetForce = useRef(0)
  const reduced = useReducedMotion()

  const geometry = useMemo(() => {
    // Лист: узкая плоскость с сегментами, чтобы её можно было гнуть
    const base = new THREE.PlaneGeometry(0.013, 1, 1, 5)
    base.translate(0, 0.5, 0)

    const geo = new THREE.InstancedBufferGeometry()
    geo.index = base.index
    geo.setAttribute('position', base.attributes.position)
    geo.setAttribute('uv', base.attributes.uv)

    const offsets = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const rots = new Float32Array(count)
    const phases = new Float32Array(count)
    const tints = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Плотнее у камеры, реже к горизонту: экономит инстансы там,
      // где их всё равно съедает туман.
      const r = Math.pow(Math.random(), 0.55) * FIELD_R
      const a = Math.random() * Math.PI * 2
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r

      offsets[i * 3] = x
      offsets[i * 3 + 1] = 0
      offsets[i * 3 + 2] = z

      // Ближняя трава чуть выше — работает как передний план кадра
      const near = 1 - Math.min(r / FIELD_R, 1)
      scales[i] = 0.075 + Math.random() * 0.105 + near * 0.05
      rots[i] = Math.random() * Math.PI * 2
      phases[i] = Math.random() * Math.PI * 2
      tints[i] = Math.random()
    }

    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3))
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1))
    geo.setAttribute('aRot', new THREE.InstancedBufferAttribute(rots, 1))
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1))
    geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 1))
    geo.instanceCount = count

    // Ручной bounding sphere: позиции живут в атрибутах, three сам их не посчитает
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.3, 0), FIELD_R + 3)

    base.dispose()
    return geo
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: 1 },
      uMouse: { value: new THREE.Vector3(0, 0, -999) },
      uMouseForce: { value: 0 },
      uScroll: { value: 0 },
      uStripeAngle: { value: STRIPE_ANGLE },
      uStripeFreq: { value: STRIPE_FREQ },
      uRoot: { value: C.root },
      uMid: { value: C.mid },
      uTip: { value: C.tip },
      uBrass: { value: C.brass },
      uFog: { value: C.fog },
      uFogNear: { value: 3.0 },
      uFogFar: { value: 15 },
    }),
    [],
  )

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const u = matRef.current?.uniforms
    if (!u) return

    const d = Math.min(delta, 0.05)
    u.uTime.value += reduced ? d * 0.25 : d

    // Проецируем курсор на плоскость земли
    ray.setFromCamera(state.pointer as THREE.Vector2, state.camera)
    if (ray.ray.intersectPlane(plane, hit)) {
      mouseWorld.current.lerp(hit, 0.12)
      targetForce.current = 1.15
    } else {
      targetForce.current = 0
    }
    mouseForce.current = lerp(mouseForce.current, targetForce.current, 0.08)

    u.uMouse.value.copy(mouseWorld.current)
    u.uMouseForce.value = reduced ? 0 : mouseForce.current
    u.uScroll.value = scrollRef.current ?? 0

    // Ветер то усиливается, то стихает
    u.uWind.value = 0.85 + Math.sin(u.uTime.value * 0.21) * 0.28 + Math.sin(u.uTime.value * 0.07) * 0.16
  })

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        ref={matRef}
        vertexShader={GRASS_VERT}
        fragmentShader={GRASS_FRAG}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent
        depthWrite
      />
    </mesh>
  )
}

/* ── Земля с рисунком покоса ────────────────────────────── */

function Ground() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const smooth = useRef(new THREE.Vector3())

  const uniforms = useMemo(
    () => ({
      uDark: { value: C.groundDark },
      uLit: { value: C.groundLit },
      uStripeAngle: { value: STRIPE_ANGLE },
      uStripeFreq: { value: STRIPE_FREQ },
      uMouse: { value: new THREE.Vector3(0, 0, -999) },
    }),
    [],
  )

  useFrame((state) => {
    const u = matRef.current?.uniforms
    if (!u) return
    ray.setFromCamera(state.pointer as THREE.Vector2, state.camera)
    if (ray.ray.intersectPlane(plane, hit)) smooth.current.lerp(hit, 0.1)
    u.uMouse.value.copy(smooth.current)
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} renderOrder={1}>
      <circleGeometry args={[FIELD_R + 5, 72]} />
      <shaderMaterial ref={matRef} vertexShader={GROUND_VERT} fragmentShader={GROUND_FRAG} uniforms={uniforms} />
    </mesh>
  )
}

/* ── Пыльца / светлячки ─────────────────────────────────── */

function Pollen({ count }: { count: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const dpr = useThree((s) => s.viewport.dpr)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const size = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.7) * 7
      const a = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 0.15 + Math.random() * 2.2
      pos[i * 3 + 2] = Math.sin(a) * r
      seed[i] = Math.random()
      size[i] = 1.2 + Math.random() * 3.4
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.2, 0), 11)
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: dpr },
      uColor: { value: C.pollen },
    }),
    [dpr],
  )

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += Math.min(delta, 0.05)
  })

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial
        ref={matRef}
        vertexShader={POLLEN_VERT}
        fragmentShader={POLLEN_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ── Камера: параллакс от курсора + подъём на скролле ───── */

function CameraRig({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  const { camera } = useThree()
  const reduced = useReducedMotion()
  const target = useMemo(() => new THREE.Vector3(0, 0.5, -1.6), [])

  useFrame((state) => {
    const s = scrollRef.current ?? 0
    const px = reduced ? 0 : state.pointer.x
    const py = reduced ? 0 : state.pointer.y

    // На скролле камера поднимается и отъезжает — поле «раскрывается»
    const baseY = 0.85 + s * 1.7
    const baseZ = 2.4 + s * 2.6

    camera.position.x = lerp(camera.position.x, px * 0.42, 0.045)
    camera.position.y = lerp(camera.position.y, baseY + py * 0.14, 0.05)
    camera.position.z = lerp(camera.position.z, baseZ, 0.05)

    // Цель ниже камеры — горизонт уходит в верхнюю треть кадра
    target.y = lerp(target.y, 0.5 - s * 0.34, 0.05)
    camera.lookAt(target)
  })

  return null
}

/* ── Сигнал готовности: три отрисованных кадра ──────────── */

function ReadyProbe({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0)
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    if (++frames.current >= 3) {
      fired.current = true
      onReady?.()
    }
  })
  return null
}

/* ── Публичный компонент ────────────────────────────────── */

export function GrassScene({
  scrollRef,
  active = true,
  onReady,
}: {
  scrollRef: React.RefObject<number>
  /** Ниже первого экрана сцену не видно — незачем жечь кадры. */
  active?: boolean
  onReady?: () => void
}) {
  const [tier, setTier] = useState<'low' | 'mid' | 'high'>('mid')

  useEffect(() => {
    const w = window.innerWidth
    const cores = navigator.hardwareConcurrency ?? 4
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (w < 720 || coarse || cores <= 4) setTier('low')
    else if (w < 1400 || cores <= 8) setTier('mid')
    else setTier('high')
  }, [])

  const bladeCount = tier === 'low' ? 14000 : tier === 'mid' ? 42000 : 72000
  const pollenCount = tier === 'low' ? 140 : tier === 'mid' ? 380 : 620
  const dpr: [number, number] = tier === 'low' ? [1, 1.35] : [1, 1.9]

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      gl={{
        antialias: tier !== 'low',
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 46, near: 0.05, far: 60, position: [0, 0.85, 2.4] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(C.fog, 1)
        scene.fog = new THREE.Fog(C.fog, 4, 18)
      }}
    >
      <Suspense fallback={null}>
        <ReadyProbe onReady={onReady} />
        <CameraRig scrollRef={scrollRef} />
        <Ground />
        <GrassField count={bladeCount} scrollRef={scrollRef} />
        <Pollen count={pollenCount} />
      </Suspense>
    </Canvas>
  )
}
