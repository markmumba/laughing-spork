import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Environment, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'

interface KeyTheme {
  bodyColor: string
  pressColor?: string
  text: string
  textColor: string
}

interface KeycapProps {
  href?: string
  hrefs?: string[]
  position: [number, number, number]
  texture: THREE.Texture
  theme: KeyTheme
}

const whiteKey: KeyTheme = {
  bodyColor: '#f3f3f0',
  pressColor: '#d8d8d4',
  text: '',
  textColor: '#101010',
}

const blackKey: KeyTheme = {
  bodyColor: '#151515',
  pressColor: '#252525',
  text: 'per',
  textColor: '#f5f5f1',
}

const KEY_SOUND_SRC = '/sound.ogg'
const KEY_SOUND_DURATION_MS = 1000
const KEY_NAVIGATION_DELAY_MS = 1100
let keySound: HTMLAudioElement | null = null
let keySoundStopTimer = 0
let keyNavigationTimer = 0

function primeKeySound() {
  if (typeof window === 'undefined') return null

  if (!keySound) {
    keySound = new Audio(KEY_SOUND_SRC)
    keySound.preload = 'auto'
    keySound.volume = 0.9
    keySound.load()
  }

  return keySound
}

function stopKeySound() {
  if (!keySound) return

  keySound.pause()

  try {
    keySound.currentTime = 0
  } catch {
    // Some browsers reject seeking before metadata is ready.
  }
}

function playKeySoundForOneSecond() {
  if (typeof window === 'undefined') return

  const sound = primeKeySound()
  if (!sound) return

  window.clearTimeout(keySoundStopTimer)
  stopKeySound()

  sound.play().catch(() => {
    // Browsers can reject audio playback outside trusted user gestures.
  })

  keySoundStopTimer = window.setTimeout(stopKeySound, KEY_SOUND_DURATION_MS)
}

function random(seed: number) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function createLineTexture(seed = 1, inverted = false) {
  const canvas = document.createElement('canvas')
  const size = 256
  const rand = random(seed)
  const ctx = canvas.getContext('2d')

  canvas.width = size
  canvas.height = size

  if (!ctx) {
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  ctx.fillStyle = inverted ? '#151515' : '#f2f2ef'
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = inverted ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  for (let x = 0; x <= size; x += 28) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }
  for (let y = 0; y <= size; y += 28) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }

  for (let i = 0; i < 680; i += 1) {
    const x = rand() * size
    const y = rand() * size
    const length = 2 + rand() * 9
    const angle = rand() * Math.PI

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
    ctx.strokeStyle = inverted
      ? `rgba(255,255,255,${0.12 + rand() * 0.24})`
      : `rgba(0,0,0,${0.1 + rand() * 0.18})`
    ctx.lineWidth = 0.7 + rand() * 0.9
    ctx.stroke()
  }

  for (let i = 0; i < 240; i += 1) {
    const x = rand() * size
    const y = rand() * size
    ctx.fillStyle = inverted
      ? `rgba(255,255,255,${0.14 + rand() * 0.24})`
      : `rgba(0,0,0,${0.12 + rand() * 0.2})`
    ctx.fillRect(x, y, 1 + rand() * 1.7, 1 + rand() * 1.7)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2.8, 2.8)
  texture.anisotropy = 8

  return texture
}

function sculptKeycapGeometry(mesh: THREE.Mesh | null) {
  if (!mesh) return

  const geometry = mesh.geometry
  const position = geometry.attributes.position
  const vertex = new THREE.Vector3()

  if (geometry.userData.keycapSculpted) return
  geometry.userData.keycapSculpted = true

  const height = 0.46

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i)
    const yNormalized = (vertex.y + height / 2) / height
    const vertical = Math.max(0, Math.min(1, yNormalized))
    const taper = 1 - vertical * 0.22

    vertex.x *= taper
    vertex.z *= taper

    if (vertical > 0.78) {
      const dish = vertex.x * vertex.x + vertex.z * vertex.z
      vertex.y += dish * 0.13
    }

    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  geometry.computeVertexNormals()
  position.needsUpdate = true
}

function Keycap({ href, hrefs, position, texture, theme }: KeycapProps) {
  const [pressed, setPressed] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const velocity = useRef(0)
  const canPress = Boolean(href || hrefs?.length)

  useLayoutEffect(() => {
    sculptKeycapGeometry(bodyRef.current)
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const target = pressed ? -0.12 : 0
    const displacement = target - groupRef.current.position.y
    const springForce = displacement * 340
    const dampingForce = -velocity.current * 24
    const acceleration = springForce + dampingForce
    const dt = Math.min(delta, 0.1)

    velocity.current += acceleration * dt
    groupRef.current.position.y += velocity.current * dt

    if (Math.abs(velocity.current) < 0.001 && Math.abs(displacement) < 0.001) {
      groupRef.current.position.y = target
      velocity.current = 0
    }
  })

  const stop = (event: ThreeEvent<MouseEvent> | ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
  }

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    stop(event)
    if (!canPress) return

    setPressed(true)
    playKeySoundForOneSecond()
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    stop(event)
    if (!canPress) return
    setPressed(false)
  }

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    stop(event)
    const targetHref = hrefs?.length
      ? hrefs[Math.floor(Math.random() * hrefs.length)]
      : href

    if (!targetHref) return

    window.clearTimeout(keyNavigationTimer)
    keyNavigationTimer = window.setTimeout(() => {
      stopKeySound()
      window.location.href = targetHref
    }, KEY_NAVIGATION_DELAY_MS)
  }

  const handlePointerOver = () => {
    if (canPress) document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    if (canPress) {
      setPressed(false)
      document.body.style.cursor = 'auto'
    }
  }

  return (
    <group position={position}>
      <group
        ref={groupRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerOut}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <RoundedBox
          ref={bodyRef}
          args={[1, 0.46, 1]}
          radius={0.075}
          smoothness={8}
          position={[0, 0.23, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={pressed && theme.pressColor ? theme.pressColor : theme.bodyColor}
            map={texture}
            bumpMap={texture}
            bumpScale={0.018}
            roughness={0.78}
            metalness={0}
          />
        </RoundedBox>

        <Text
          position={[0, 0.535, -0.02]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={theme.text.length > 2 ? 0.22 : 0.26}
          color={theme.textColor}
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
        >
          {theme.text}
        </Text>
      </group>

      <ContactShadows position={[0, -0.08, 0]} opacity={0.25} scale={1.55} blur={2.1} far={1.6} />
    </group>
  )
}

export default function DeveloperKeyScene({ href = '#projects', hrefs }: { href?: string; hrefs?: string[] }) {
  const whiteTexture = useMemo(() => createLineTexture(8, false), [])
  const blackTexture = useMemo(() => createLineTexture(21, true), [])

  useLayoutEffect(() => {
    primeKeySound()

    return () => {
      window.clearTimeout(keySoundStopTimer)
      window.clearTimeout(keyNavigationTimer)
    }
  }, [])

  return (
    <Canvas
      camera={{ position: [3.05, 2.45, 4.45], fov: 42 }}
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={1.55} />
        <directionalLight position={[2.8, 5, 3.2]} intensity={2.4} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.72} />
        <Environment preset="studio" />

        <group rotation={[0.36, -0.12, 0]} position={[0, -0.06, 0]}>
          <Keycap position={[-1.95, 0, 0]} texture={whiteTexture} theme={{ ...whiteKey, text: 'de' }} href={href} hrefs={hrefs} />
          <Keycap position={[-0.65, 0, 0]} texture={whiteTexture} theme={{ ...whiteKey, text: 've' }} href={href} hrefs={hrefs} />
          <Keycap position={[0.65, 0, 0]} texture={whiteTexture} theme={{ ...whiteKey, text: 'lo' }} href={href} hrefs={hrefs} />
          <Keycap position={[1.95, 0, 0]} texture={blackTexture} theme={blackKey} href={href} hrefs={hrefs} />
          <ContactShadows position={[0, -0.12, 0]} opacity={0.2} scale={6.6} blur={4.2} far={3.2} />
        </group>
      </Suspense>
    </Canvas>
  )
}
