import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const START_YAW = -0.38
const START_PITCH = 0.08

function buildMonitor(): THREE.Group {
  const monitor = new THREE.Group()
  const shell = new THREE.MeshStandardMaterial({ color: 0xd6c8aa, roughness: 0.73, metalness: 0.01 })
  const face = new THREE.MeshStandardMaterial({ color: 0xe6d9bf, roughness: 0.65, metalness: 0.01 })
  const recess = new THREE.MeshStandardMaterial({ color: 0x151a1b, roughness: 0.83 })
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x263136, roughness: 0.21, metalness: 0.16, clearcoat: 0.8, clearcoatRoughness: 0.14, side: THREE.DoubleSide })
  const rubber = new THREE.MeshStandardMaterial({ color: 0x2c2c29, roughness: 0.85 })
  const seam = new THREE.MeshStandardMaterial({ color: 0xb7aa90, roughness: 0.85 })
  const led = new THREE.MeshBasicMaterial({ color: 0x4076bb })

  function rounded(width: number, height: number, depth: number, x: number, y: number, z: number, radius: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 4, radius), material)
    mesh.position.set(x, y, z)
    monitor.add(mesh)
    return mesh
  }

  function bar(width: number, height: number, depth: number, x: number, y: number, z: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
    mesh.position.set(x, y, z)
    monitor.add(mesh)
    return mesh
  }

  // A rounded front flows into the smaller rear housing, exposing the CRT's depth in profile.
  const rings = [
    { width: 4.46, height: 3.30, radius: 0.32, z: 1.04 },
    { width: 4.44, height: 3.28, radius: 0.34, z: 0.58 },
    { width: 4.05, height: 3.02, radius: 0.41, z: -0.52 },
    { width: 3.34, height: 2.42, radius: 0.46, z: -1.56 },
  ]
  const pointsPerCorner = 8
  const contour = (width: number, height: number, radius: number) => {
    const corners = [
      [width / 2 - radius, height / 2 - radius, 0],
      [-width / 2 + radius, height / 2 - radius, Math.PI / 2],
      [-width / 2 + radius, -height / 2 + radius, Math.PI],
      [width / 2 - radius, -height / 2 + radius, Math.PI * 1.5],
    ]
    return corners.flatMap(([cx, cy, start]) => Array.from({ length: pointsPerCorner }, (_, index) => {
      const angle = start + index / (pointsPerCorner - 1) * Math.PI / 2
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
    }))
  }
  const ringSize = pointsPerCorner * 4
  const vertices: number[] = []
  const indices: number[] = []
  for (const ring of rings) {
    for (const [x, y] of contour(ring.width, ring.height, ring.radius)) vertices.push(x, y + 0.22, ring.z)
  }
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let index = 0; index < ringSize; index++) {
      const next = (index + 1) % ringSize
      const front = ring * ringSize + index
      const frontNext = ring * ringSize + next
      const back = (ring + 1) * ringSize + index
      const backNext = (ring + 1) * ringSize + next
      indices.push(front, back, frontNext, frontNext, back, backNext)
    }
  }
  const frontCenter = vertices.length / 3
  vertices.push(0, 0.22, rings[0].z)
  const backCenter = vertices.length / 3
  vertices.push(0, 0.22, rings.at(-1)!.z)
  for (let index = 0; index < ringSize; index++) {
    const next = (index + 1) % ringSize
    indices.push(frontCenter, index, next)
    indices.push(backCenter, (rings.length - 1) * ringSize + next, (rings.length - 1) * ringSize + index)
  }
  const cabinetGeometry = new THREE.BufferGeometry()
  cabinetGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  cabinetGeometry.setIndex(indices)
  cabinetGeometry.computeVertexNormals()
  monitor.add(new THREE.Mesh(cabinetGeometry, shell))

  // The screen occupies the face; the only controls live in the lower chin.
  rounded(4.49, 3.35, 0.15, 0, 0.22, 1.09, 0.30, seam)
  rounded(4.43, 3.29, 0.15, 0, 0.22, 1.15, 0.29, face)
  rounded(3.89, 2.74, 0.06, 0, 0.46, 1.24, 0.25, seam)
  rounded(3.80, 2.65, 0.08, 0, 0.46, 1.29, 0.24, recess)
  rounded(3.60, 2.44, 0.05, 0, 0.46, 1.34, 0.22, rubber)

  const screenGeometry = new THREE.PlaneGeometry(3.52, 2.36, 32, 24)
  const positions = screenGeometry.attributes.position
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index) / 1.76
    const y = positions.getY(index) / 1.18
    positions.setZ(index, 0.11 * (1 - x * x) * (1 - y * y))
  }
  screenGeometry.computeVertexNormals()
  const screen = new THREE.Mesh(screenGeometry, glass)
  screen.position.set(0, 0.46, 1.39)
  monitor.add(screen)

  const highlight = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 0.19),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.035, depthWrite: false }),
  )
  highlight.position.set(-0.80, 1.30, 1.495)
  highlight.rotation.z = -0.08
  monitor.add(highlight)

  const pointerShape = new THREE.Shape()
  pointerShape.moveTo(0, 0.10)
  pointerShape.lineTo(0, -0.10)
  pointerShape.lineTo(0.048, -0.053)
  pointerShape.lineTo(0.078, -0.12)
  pointerShape.lineTo(0.11, -0.106)
  pointerShape.lineTo(0.075, -0.038)
  pointerShape.lineTo(0.14, -0.038)
  pointerShape.closePath()
  const pointer = new THREE.Mesh(new THREE.ShapeGeometry(pointerShape), new THREE.MeshBasicMaterial({ color: 0x527fbc, side: THREE.DoubleSide }))
  pointer.position.set(0.06, 0.42, 1.505)
  monitor.add(pointer)

  rounded(0.55, 0.055, 0.025, -1.58, -1.20, 1.235, 0.02, seam)
  for (const x of [0.90, 1.14, 1.38]) rounded(0.12, 0.05, 0.045, x, -1.21, 1.25, 0.02, seam)
  const power = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 24), recess)
  power.rotation.x = Math.PI / 2
  power.position.set(1.76, -1.20, 1.27)
  monitor.add(power)
  const light = new THREE.Mesh(new THREE.CircleGeometry(0.027, 20), led)
  light.position.set(1.56, -1.20, 1.27)
  monitor.add(light)

  // Shallow side vents sit near the front, inside the tapered shell.
  for (const side of [-1, 1]) {
    for (let index = 0; index < 8; index++) {
      rounded(0.012, 0.027, 0.28, side * 2.185, 0.85 - index * 0.14, 0.46, 0.005, seam)
    }
  }

  rounded(2.84, 1.90, 0.045, 0, 0.23, -1.59, 0.20, seam)
  rounded(2.76, 1.82, 0.05, 0, 0.23, -1.62, 0.19, shell)
  for (let index = 0; index < 10; index++) {
    bar(1.88, 0.028, 0.014, 0, 0.93 - index * 0.12, -1.654, seam)
  }
  rounded(0.72, 0.28, 0.035, -0.73, -0.47, -1.66, 0.04, face)
  rounded(0.44, 0.18, 0.03, 0.65, -0.48, -1.66, 0.04, rubber)

  // Swivel neck and low oval pedestal make it read as a desktop display.
  rounded(0.84, 0.30, 0.83, 0, -1.45, -0.18, 0.11, seam)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.42, 0.52, 32), shell)
  neck.position.set(0, -1.74, -0.18)
  monitor.add(neck)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.10, 1.22, 0.15, 64), face)
  base.scale.z = 0.78
  base.position.set(0, -2.06, -0.18)
  monitor.add(base)
  const baseRim = new THREE.Mesh(new THREE.CylinderGeometry(1.21, 1.23, 0.035, 64), seam)
  baseRim.scale.z = 0.79
  baseRim.position.set(0, -2.13, -0.18)
  monitor.add(baseRim)

  return monitor
}

export default function Monitor3D() {
  const hostRef = useRef<HTMLDivElement>(null)
  const resetRef = useRef<(() => void) | null>(null)
  const [rotated, setRotated] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    } catch {
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0xffffff, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const canvas = renderer.domElement
    canvas.className = 'hero__canvas'
    canvas.tabIndex = 0
    canvas.setAttribute('data-rotatable', '')
    canvas.setAttribute('aria-label', 'Rotatable 3D monitor. Drag to inspect it, use arrow keys to rotate, or press Home to reset.')
    host.appendChild(canvas)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
    camera.position.set(0, 0, 7.3)
    camera.lookAt(0, 0, 0)
    const monitor = buildMonitor()
    monitor.rotation.set(START_PITCH, START_YAW, 0)
    scene.add(monitor)
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9ad96, 2.8))
    const key = new THREE.DirectionalLight(0xffffff, 2.3)
    key.position.set(-3, 5, 7)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffefd1, 1.5)
    rim.position.set(4, 2, -5)
    scene.add(rim)

    let targetYaw = START_YAW
    let targetPitch = START_PITCH
    let dragging = false
    let interacted = false
    let lastX = 0
    let lastY = 0
    let frame = 0
    let visible = true
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      renderer.render(scene, camera)
    }

    const animate = () => {
      frame = window.requestAnimationFrame(animate)
      if (!visible) return
      const ease = reducedMotion ? 1 : 0.12
      monitor.rotation.y += (targetYaw - monitor.rotation.y) * ease
      monitor.rotation.x += (targetPitch - monitor.rotation.x) * ease
      renderer.render(scene, camera)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return
      dragging = true
      interacted = true
      lastX = event.clientX
      lastY = event.clientY
      canvas.setPointerCapture(event.pointerId)
      canvas.classList.add('hero__canvas--dragging')
      setRotated(true)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (dragging) {
        targetYaw += (event.clientX - lastX) * 0.012
        targetPitch = THREE.MathUtils.clamp(targetPitch + (event.clientY - lastY) * 0.008, -0.95, 0.95)
        lastX = event.clientX
        lastY = event.clientY
      } else if (!interacted && event.pointerType === 'mouse') {
        const bounds = canvas.getBoundingClientRect()
        targetYaw = START_YAW + ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.35
        targetPitch = START_PITCH + ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.18
      }
    }

    const onPointerUp = () => {
      dragging = false
      canvas.classList.remove('hero__canvas--dragging')
    }

    const onPointerLeave = () => {
      if (!interacted) {
        targetYaw = START_YAW
        targetPitch = START_PITCH
      }
    }

    const reset = () => {
      interacted = false
      targetYaw = START_YAW
      targetPitch = START_PITCH
      setRotated(false)
      canvas.focus()
    }
    resetRef.current = reset

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Home') {
        event.preventDefault()
        reset()
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        targetYaw += event.key === 'ArrowLeft' ? -0.25 : 0.25
        interacted = true
        setRotated(true)
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        targetPitch = THREE.MathUtils.clamp(targetPitch + (event.key === 'ArrowUp' ? -0.18 : 0.18), -0.95, 0.95)
        interacted = true
        setRotated(true)
      }
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    visibility.observe(host)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('keydown', onKeyDown)
    resize()
    animate()
    host.classList.add('hero__object--ready')

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('keydown', onKeyDown)
      resetRef.current = null
      const materials = new Set<THREE.Material>()
      monitor.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
        }
      })
      for (const material of materials) material.dispose()
      renderer.dispose()
      canvas.remove()
      host.classList.remove('hero__object--ready')
    }
  }, [])

  return (
    <div className="hero__object" ref={hostRef}>
      <img className="hero__object-fallback" src="/retro-monitor.png" alt="Vintage cream CRT monitor" />
      {rotated && <button className="hero__reset" type="button" onClick={() => resetRef.current?.()}>Reset view</button>}
    </div>
  )
}
