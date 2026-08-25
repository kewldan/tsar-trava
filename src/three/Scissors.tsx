import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { lerp } from '../lib/hooks'

/**
 * Маникюрные ножницы — тот самый инструмент финишной доводки.
 * Модель строится процедурно: два лезвия из 2D-профиля через ExtrudeGeometry,
 * кольца с отверстием, винт по центру. Грузить .glb ради этого незачем.
 *
 * Половинки вращаются вокруг оси винта, «щёлк» идёт по резкой кривой:
 * быстрое смыкание, медленное раскрытие — как у настоящих ножниц.
 */

const EXTRUDE = {
  depth: 0.05,
  bevelEnabled: true,
  bevelThickness: 0.012,
  bevelSize: 0.012,
  bevelSegments: 3,
  curveSegments: 24,
}

/** Половинка: лезвие от винта к кончику + хвостовик к кольцу. */
function bladeShape() {
  const s = new THREE.Shape()
  // Режущая кромка: короткая и загнутая вверх — характерная черта
  // маникюрных ножниц, лезвие втрое короче ручек
  s.moveTo(0.15, -0.03)
  s.quadraticCurveTo(0.52, 0.05, 0.86, 0.19)
  // Острый кончик
  s.quadraticCurveTo(0.95, 0.225, 0.93, 0.265)
  // Обух — выпуклый, к кончику лезвие сходит на нет
  s.quadraticCurveTo(0.58, 0.2, 0.28, 0.125)
  // Плечо у винта
  s.quadraticCurveTo(0.2, 0.105, 0.15, 0.07)
  // Длинный хвостовик уходит назад под кольцо
  s.lineTo(-0.34, 0.015)
  s.quadraticCurveTo(-0.8, -0.03, -1.06, -0.22)
  s.lineTo(-0.95, -0.35)
  s.quadraticCurveTo(-0.54, -0.16, -0.24, -0.11)
  s.lineTo(0.09, -0.075)
  s.closePath()
  return s
}

/** Кольцо для пальца: эллипс с эллиптическим отверстием. */
function ringShape() {
  const outer = new THREE.Shape()
  outer.absellipse(0, 0, 0.42, 0.33, 0, Math.PI * 2, false, 0)
  const hole = new THREE.Path()
  hole.absellipse(0, 0, 0.3, 0.22, 0, Math.PI * 2, true, 0)
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

  const blade = useMemo(() => new THREE.ExtrudeGeometry(bladeShape(), EXTRUDE), [])
  const ring = useMemo(() => new THREE.ExtrudeGeometry(ringShape(), { ...EXTRUDE, depth: 0.045 }), [])

  useFrame(() => {
    const g = group.current
    if (!g) {
      return
    }
    g.rotation.z = (angleRef.current ?? 0) * side
  })

  return (
    <group ref={group} position={[0, 0, side * 0.028]}>
      <mesh geometry={blade} material={steel} scale={[1, side, 1]} />
      <mesh geometry={ring} material={brass} position={[-1.44, side * -0.56, 0]} rotation={[0, 0, side * -0.42]} />
    </group>
  )
}

/** Процедурная студия: тёплый софтбокс сверху-слева, зелёный отскок снизу. */
function StudioEnv() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 256
    const ctx = c.getContext('2d')
    if (!ctx) {
      return
    }

    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#3c3527')
    g.addColorStop(0.4, '#161d18')
    g.addColorStop(0.62, '#0a0f0c')
    g.addColorStop(1, '#0f2a1b')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 256)

    // Софтбокс — главный источник бликов на лезвии
    const key = ctx.createRadialGradient(150, 42, 4, 150, 42, 130)
    key.addColorStop(0, '#fff6e2')
    key.addColorStop(0.45, '#c8a96a')
    key.addColorStop(1, 'rgba(200,169,106,0)')
    ctx.fillStyle = key
    ctx.fillRect(0, 0, 512, 200)

    // Контровой справа-сзади
    const rim = ctx.createRadialGradient(400, 96, 2, 400, 96, 90)
    rim.addColorStop(0, '#e3c88f')
    rim.addColorStop(1, 'rgba(227,200,143,0)')
    ctx.fillStyle = rim
    ctx.fillRect(256, 0, 256, 220)

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
        color: '#e8ecef',
        metalness: 1,
        roughness: 0.11,
        envMapIntensity: 2.4,
      }),
    [],
  )
  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c8a96a',
        metalness: 1,
        roughness: 0.2,
        envMapIntensity: 2.1,
      }),
    [],
  )
  const screw = useMemo(() => new THREE.CylinderGeometry(0.075, 0.075, 0.14, 24), [])

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

    g.rotation.y = lerp(g.rotation.y, -0.35 + state.pointer.x * 0.55, 0.05)
    g.rotation.x = lerp(g.rotation.x, -0.18 + state.pointer.y * 0.3, 0.05)
    g.rotation.z = Math.sin(t.current * 0.3) * 0.09
    g.position.y = Math.sin(t.current * 0.55) * 0.06
  })

  return (
    <group ref={root} position={[0.3, 0, 0]} scale={0.88}>
      <Half side={1} angleRef={angle} steel={steel} brass={brass} />
      <Half side={-1} angleRef={angle} steel={steel} brass={brass} />
      {/* Винт */}
      <mesh geometry={screw} rotation={[Math.PI / 2, 0, 0]} material={brass} />
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
      <ambientLight intensity={0.32} color="#20402f" />
      {/* Ключевой сверху-слева, латунный контровой справа-сзади, зелёный отражённый снизу */}
      <directionalLight position={[-4, 5, 4]} intensity={2.4} color="#fff4dc" />
      <directionalLight position={[5, 1.5, -4]} intensity={3.4} color="#c8a96a" />
      <directionalLight position={[2, -3, 3]} intensity={1.2} color="#2f8a55" />
      <pointLight position={[0, 0, 3]} intensity={7} distance={10} color="#e3c88f" />
      <ScissorsModel speedRef={speedRef} />
    </Canvas>
  )
}
