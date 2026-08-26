import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { lerp } from '../lib/hooks'

/**
 * Маникюрные ножницы — тот самый инструмент финишной доводки.
 *
 * Пропорции срисованы с Rubis 1F000 Classic (Швейцария): общая длина 90 мм,
 * хирургическая нержавеющая сталь, изогнутое лезвие примерно втрое короче
 * ручек, узкие вытянутые кольца.
 *
 * Лезвие — не плоская пластина из ExtrudeGeometry, а параметрическая
 * поверхность: вдоль идёт от винта к кончику, поперёк — от режущей кромки
 * к обуху, и толщина сходит на нет и там, и там. Без этого клинок выглядит
 * слябом: вся грань ловит один и тот же блик, и предмет читается плоским.
 *
 * Половинки вращаются вокруг оси винта, «щёлк» идёт по резкой кривой:
 * быстрое смыкание, медленное раскрытие — как у настоящих ножниц.
 */

/** Точка на квадратичной кривой Безье. */
function bez(p0: [number, number], p1: [number, number], p2: [number, number], t: number) {
  const k = 1 - t
  return [
    k * k * p0[0] + 2 * k * t * p1[0] + t * t * p2[0],
    k * k * p0[1] + 2 * k * t * p1[1] + t * t * p2[1],
  ] as const
}

// Режущая кромка и обух сходятся в одной точке — кончике
const EDGE: [[number, number], [number, number], [number, number]] = [
  [0.12, -0.005],
  [0.62, 0.03],
  [1.04, 0.182],
]
const SPINE: [[number, number], [number, number], [number, number]] = [
  [0.12, 0.118],
  [0.6, 0.152],
  [1.04, 0.182],
]

const BLADE_THICKNESS = 0.062

/**
 * Толщина в точке: 0 у самой кромки, максимум у обуха, и всё вместе
 * убывает к кончику. Степени подобраны так, чтобы спуск был вогнутым,
 * как у заточенного клинка, а не линейным клином.
 */
function thickness(u: number, v: number) {
  return BLADE_THICKNESS * v ** 0.62 * (1 - 0.74 * u ** 1.45)
}

function bladeGeometry() {
  const Along = 56 // сегментов вдоль лезвия
  const Across = 10 // сегментов от кромки к обуху (на каждую сторону)
  const Ring = Across * 2 // замкнутый профиль поперечного сечения

  const pos: number[] = []
  const idx: number[] = []

  for (let iu = 0; iu <= Along; iu++) {
    const u = iu / Along
    const e = bez(EDGE[0], EDGE[1], EDGE[2], u)
    const s = bez(SPINE[0], SPINE[1], SPINE[2], u)

    // Обходим сечение по кругу: кромка → верхняя грань → обух →
    // нижняя грань → обратно к кромке
    for (let j = 0; j < Ring; j++) {
      const half = j <= Across ? j / Across : (Ring - j) / Across
      const sign = j <= Across ? 1 : -1
      const v = half
      const h = (thickness(u, v) / 2) * sign
      pos.push(e[0] + (s[0] - e[0]) * v, e[1] + (s[1] - e[1]) * v, h)
    }
  }

  for (let iu = 0; iu < Along; iu++) {
    for (let j = 0; j < Ring; j++) {
      const a = iu * Ring + j
      const b = iu * Ring + ((j + 1) % Ring)
      const c = (iu + 1) * Ring + j
      const d = (iu + 1) * Ring + ((j + 1) % Ring)
      idx.push(a, c, b, b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

const EXTRUDE = {
  bevelEnabled: true,
  bevelThickness: 0.01,
  bevelSize: 0.01,
  bevelSegments: 3,
  curveSegments: 32,
}

/** Хвостовик: от винта назад к кольцу, к концу слегка расширяется. */
function shankShape() {
  const s = new THREE.Shape()
  s.moveTo(0.14, 0.1)
  s.bezierCurveTo(-0.22, 0.05, -0.6, -0.02, -0.9, -0.17)
  s.lineTo(-1.02, -0.33)
  s.bezierCurveTo(-0.72, -0.21, -0.4, -0.14, -0.08, -0.09)
  s.lineTo(0.14, -0.05)
  s.closePath()
  return s
}

/** Кольцо для пальца: у маникюрных оно узкое и вытянутое, а не круглое. */
function ringShape() {
  const outer = new THREE.Shape()
  outer.absellipse(0, 0, 0.46, 0.3, 0, Math.PI * 2, false, 0)
  const hole = new THREE.Path()
  hole.absellipse(0, 0, 0.35, 0.2, 0, Math.PI * 2, true, 0)
  outer.holes.push(hole)
  return outer
}

function Half({
  side,
  angleRef,
  steel,
  brass,
}: {
  side: 1 | -1
  angleRef: React.RefObject<number>
  steel: THREE.Material
  brass: THREE.Material
}) {
  const group = useRef<THREE.Group>(null)

  const blade = useMemo(() => bladeGeometry(), [])
  const shank = useMemo(() => new THREE.ExtrudeGeometry(shankShape(), { ...EXTRUDE, depth: 0.05 }), [])
  const ring = useMemo(() => new THREE.ExtrudeGeometry(ringShape(), { ...EXTRUDE, depth: 0.05 }), [])

  useFrame(() => {
    const g = group.current
    if (!g) {
      return
    }
    g.rotation.z = (angleRef.current ?? 0) * side
  })

  return (
    <group ref={group} position={[0, 0, side * 0.03]}>
      <mesh geometry={blade} material={steel} scale={[1, side, 1]} />
      <mesh geometry={shank} material={steel} scale={[1, side, 1]} position={[0, 0, -0.025]} />
      <mesh
        geometry={ring}
        material={brass}
        position={[-1.4, side * -0.54, -0.025]}
        rotation={[0, 0, side * -0.42]}
      />
    </group>
  )
}

/**
 * Процедурная студия для отражений.
 *
 * Полированный металл виден только через то, что в нём отражается: без
 * окружения он читается почти чёрным. Поэтому в панораме есть крупный
 * софтбокс и узкая яркая полоса — она даёт тот самый вытянутый блик
 * вдоль клинка, по которому глаз и опознаёт сталь.
 */
function StudioEnv() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 512
    const ctx = c.getContext('2d')
    if (!ctx) {
      return
    }

    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, '#5b5342')
    g.addColorStop(0.36, '#232c25')
    g.addColorStop(0.6, '#0c1310')
    g.addColorStop(1, '#163a24')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1024, 512)

    // Софтбокс — главный источник бликов на лезвии
    const key = ctx.createRadialGradient(300, 74, 8, 300, 74, 260)
    key.addColorStop(0, '#fffdf6')
    key.addColorStop(0.35, '#e8d9b4')
    key.addColorStop(1, 'rgba(200,169,106,0)')
    ctx.fillStyle = key
    ctx.fillRect(0, 0, 1024, 380)

    // Узкая яркая полоса: вытянутый блик вдоль полированной грани
    const strip = ctx.createLinearGradient(0, 150, 0, 210)
    strip.addColorStop(0, 'rgba(255,252,240,0)')
    strip.addColorStop(0.5, 'rgba(255,252,240,0.95)')
    strip.addColorStop(1, 'rgba(255,252,240,0)')
    ctx.fillStyle = strip
    ctx.fillRect(0, 150, 1024, 60)

    // Контровой справа-сзади, латунный
    const rim = ctx.createRadialGradient(800, 200, 4, 800, 200, 190)
    rim.addColorStop(0, '#f2dcae')
    rim.addColorStop(1, 'rgba(227,200,143,0)')
    ctx.fillStyle = rim
    ctx.fillRect(560, 40, 464, 380)

    const tex = new THREE.CanvasTexture(c)
    tex.mapping = THREE.EquirectangularReflectionMapping
    tex.colorSpace = THREE.SRGBColorSpace

    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromEquirectangular(tex).texture
    scene.environment = env

    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
      tex.dispose()
    }
  }, [gl, scene])

  return null
}

function ScissorsModel({ speedRef }: { speedRef: React.RefObject<number> }) {
  const root = useRef<THREE.Group>(null)
  const angle = useRef(0.18)
  const t = useRef(0)

  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f0f3f5',
        metalness: 1,
        roughness: 0.09,
        envMapIntensity: 3.1,
      }),
    [],
  )
  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c8a96a',
        metalness: 1,
        roughness: 0.17,
        envMapIntensity: 2.6,
      }),
    [],
  )
  const screw = useMemo(() => new THREE.CylinderGeometry(0.082, 0.082, 0.19, 28), [])
  const screwSlot = useMemo(() => new THREE.BoxGeometry(0.11, 0.016, 0.02), [])

  useFrame((state, delta) => {
    const g = root.current
    if (!g) {
      return
    }
    const d = Math.min(delta, 0.05)

    // Скорость «щелчка» подхватывается от скорости прокрутки
    const speed = speedRef.current ?? 1
    t.current += d * (0.9 + speed * 0.35)

    // Пила: быстрое смыкание, медленное раскрытие
    const cycle = (t.current * 0.62) % 1
    const snip = cycle < 0.18 ? 1 - cycle / 0.18 : (cycle - 0.18) / 0.82
    angle.current = lerp(angle.current, 0.035 + snip * 0.2, 0.25)

    g.rotation.y = lerp(g.rotation.y, -0.42 + state.pointer.x * 0.5, 0.05)
    g.rotation.x = lerp(g.rotation.x, -0.16 + state.pointer.y * 0.28, 0.05)
    g.rotation.z = Math.sin(t.current * 0.3) * 0.08
    g.position.y = Math.sin(t.current * 0.55) * 0.06
  })

  return (
    <group ref={root} position={[0.32, 0, 0]} scale={0.92}>
      <Half side={1} angleRef={angle} steel={steel} brass={brass} />
      <Half side={-1} angleRef={angle} steel={steel} brass={brass} />
      {/* Винт с прорезью — по нему читается ось вращения */}
      <mesh geometry={screw} rotation={[Math.PI / 2, 0, 0]} material={brass} />
      <mesh geometry={screwSlot} position={[0, 0, 0.096]} material={brass} />
    </group>
  )
}

export function Scissors({ speedRef }: { speedRef: React.RefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 32, position: [0, 0.05, 5.4] }}
    >
      <StudioEnv />
      <ambientLight intensity={0.25} color="#20402f" />
      {/* Ключевой сверху-слева, латунный контровой справа-сзади */}
      <directionalLight position={[-4, 5, 4]} intensity={2.2} color="#fff4dc" />
      <directionalLight position={[5, 1.5, -4]} intensity={2.8} color="#c8a96a" />
      <directionalLight position={[2, -3, 3]} intensity={1} color="#2f8a55" />
      <ScissorsModel speedRef={speedRef} />
    </Canvas>
  )
}
