import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { asset, lerp } from '../lib/hooks'

/**
 * Ножницы в блоке «Парк» — готовая модель, а не процедурная геометрия.
 *
 * public/models/scissors.glb: MilkAndBanana, Poly Pizza, лицензия CC0.
 * Половинки лежат в модели отдельными группами, а винт — третьей, поэтому
 * «щёлк» можно анимировать: каждая половинка вращается вокруг оси винта.
 *
 * Материалы из файла не используются — ручки в нём ярко-красные. Меши
 * пересобираются на месте: лезвия получают полированную сталь, ручки
 * латунь из палитры сайта.
 */

/** Ось винта в координатах модели — вокруг неё раскрываются половинки. */
const PIVOT = new THREE.Vector3(-0.01, 0.53, 0.11)

/** Материал ручек в исходном файле: по нему отличаем их от лезвий. */
const HANDLE_MATERIAL = 'mat8'

function ScissorsModel({ speedRef }: { speedRef: React.RefObject<number> }) {
  const root = useRef<THREE.Group>(null)
  const halves = useRef<THREE.Object3D[]>([])
  const angle = useRef(0.18)
  const t = useRef(0)

  const gltf = useLoader(GLTFLoader, asset('models/scissors.glb'))

  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e9eef2',
        metalness: 0.9,
        roughness: 0.26,
        envMapIntensity: 2.6,
      }),
    [],
  )
  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c8a96a',
        metalness: 0.95,
        roughness: 0.28,
        envMapIntensity: 2.1,
      }),
    [],
  )

  /**
   * Пересобираем сцену из файла: каждую половинку заворачиваем в узел,
   * стоящий на оси винта, чтобы вращать её вокруг него, а не вокруг
   * начала координат модели.
   */
  const scene = useMemo(() => {
    const src = gltf.scene.clone(true)
    const out = new THREE.Group()
    const moving: THREE.Object3D[] = []

    for (const child of [...src.children]) {
      const wrap = new THREE.Group()
      wrap.position.copy(PIVOT)
      child.position.sub(PIVOT)
      wrap.add(child)
      out.add(wrap)

      // Винт остаётся неподвижным, половинки раскрываются
      const isScrew = child.name.includes('1733702132')
      if (!isScrew) {
        moving.push(wrap)
      }
    }

    out.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) {
        return
      }
      const name = (mesh.material as THREE.Material)?.name ?? ''
      mesh.material = name === HANDLE_MATERIAL ? brass : steel
    })

    halves.current = moving
    return out
  }, [gltf, steel, brass])

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
    angle.current = lerp(angle.current, -0.03 + snip * 0.13, 0.25)

    // Модель лежит в плоскости YZ, поэтому ось раскрытия — X
    halves.current.forEach((half, i) => {
      half.rotation.x = angle.current * (i === 0 ? 1 : -1)
    })

    g.rotation.y = lerp(g.rotation.y, 0.06 + state.pointer.x * 0.36, 0.05)
    g.rotation.x = lerp(g.rotation.x, -0.06 + state.pointer.y * 0.2, 0.05)
    g.rotation.z = Math.sin(t.current * 0.3) * 0.07
    g.position.y = Math.sin(t.current * 0.55) * 0.06
  })

  return (
    <group ref={root} scale={0.72}>
      <primitive object={scene} rotation={[0, Math.PI / 2, 0]} position={[0, -0.34, 0]} />
    </group>
  )
}

/**
 * Процедурная студия для отражений.
 *
 * Полированный металл виден только через то, что в нём отражается: без
 * окружения он читается почти чёрным. Поэтому в панораме есть крупный
 * софтбокс и узкая яркая полоса — она даёт вытянутый блик вдоль лезвия,
 * по которому глаз и опознаёт сталь.
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

    const key = ctx.createRadialGradient(300, 74, 8, 300, 74, 260)
    key.addColorStop(0, '#fffdf6')
    key.addColorStop(0.35, '#e8d9b4')
    key.addColorStop(1, 'rgba(200,169,106,0)')
    ctx.fillStyle = key
    ctx.fillRect(0, 0, 1024, 380)

    const strip = ctx.createLinearGradient(0, 150, 0, 210)
    strip.addColorStop(0, 'rgba(255,252,240,0)')
    strip.addColorStop(0.5, 'rgba(255,252,240,0.95)')
    strip.addColorStop(1, 'rgba(255,252,240,0)')
    ctx.fillStyle = strip
    ctx.fillRect(0, 150, 1024, 60)

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

export function Scissors({ speedRef }: { speedRef: React.RefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 32, position: [0, 0.1, 7.6] }}
    >
      <StudioEnv />
      <ambientLight intensity={0.34} color="#243a30" />
      {/* Ключевой сверху-слева, латунный контровой справа-сзади.
          Зелёного заполняющего нет: на гранях низкополигональной модели
          он давал кислые пятна вместо мягкого отскока. */}
      <directionalLight position={[-4, 5, 4]} intensity={2.6} color="#fff4dc" />
      <directionalLight position={[5, 1.5, -4]} intensity={2.6} color="#c8a96a" />
      <ScissorsModel speedRef={speedRef} />
    </Canvas>
  )
}
