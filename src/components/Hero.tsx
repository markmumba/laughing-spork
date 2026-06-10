import { useRef, useEffect, useState } from 'react'
import './Hero.css'

// ─── Scramble Text ────────────────────────────────────────────────────────────

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&'

function ScrambleText({ text, delay = 0, duration = 1400 }: { text: string; delay?: number; duration?: number }) {
  const [display, setDisplay] = useState(() =>
    text.split('').map(char =>
      /[A-Z0-9]/i.test(char)
        ? SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        : char
    ).join('')
  )

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text)
      return
    }

    let startTime: number | null = null
    let rafId: number
    const lockable = text.replace(/[^A-Z0-9]/gi, '').length

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime - delay

      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick)
        return
      }

      const progress = Math.min(elapsed / duration, 1)

      setDisplay(
        text.split('').map((char, i) => {
          if (!/[A-Z0-9]/i.test(char)) return char
          const lockAt = ((i + 1) / lockable) * 0.82
          if (progress >= lockAt) return char
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        }).join('')
      )

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        setDisplay(text)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [text, delay, duration])

  return <>{display}</>
}

// ─── Hero Maze ────────────────────────────────────────────────────────────────

const MAZE_CELL = 56

function mazeGenPath(cols: number, rows: number, startRow: number, seed: number): Array<[number, number]> {
  let s = seed
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296 }
  const path: Array<[number, number]> = [[0, startRow]]
  let cx = 0, cy = startRow, streak = 0
  while (cx < cols - 1) {
    const r = rng()
    const canTurn = streak >= 2
    if (canTurn && r < 0.12 && cy > 1)             { cy--; streak = 0 }
    else if (canTurn && r < 0.24 && cy < rows - 2) { cy++; streak = 0 }
    else                                            { cx++; streak++ }
    path.push([cx, cy])
  }
  return path
}

function mazeDraw(ctx: CanvasRenderingContext2D, path: Array<[number, number]>, progress: number, CELL: number) {
  if (path.length < 2 || progress < 0.01) return
  const headIdx = Math.min(Math.floor(progress), path.length - 2)
  const headFrac = progress - headIdx
  const [ax, ay] = path[headIdx]
  const [bx, by] = path[Math.min(headIdx + 1, path.length - 1)]
  const hx = (ax + (bx - ax) * headFrac) * CELL
  const hy = (ay + (by - ay) * headFrac) * CELL

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255,255,255,0.055)'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.moveTo(path[0][0] * CELL, path[0][1] * CELL)
  for (let i = 1; i <= headIdx; i++) ctx.lineTo(path[i][0] * CELL, path[i][1] * CELL)
  ctx.lineTo(hx, hy)
  ctx.stroke()

  if (progress >= path.length - 1) return

  const ts = Math.max(0, headIdx - 4)
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 1.5
  ctx.moveTo(path[ts][0] * CELL, path[ts][1] * CELL)
  for (let i = ts + 1; i <= headIdx; i++) ctx.lineTo(path[i][0] * CELL, path[i][1] * CELL)
  ctx.lineTo(hx, hy)
  ctx.stroke()

  const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10)
  g.addColorStop(0,   'rgba(255,255,255,0.38)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.08)')
  g.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.beginPath(); ctx.fillStyle = g; ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fill()

  ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.arc(hx, hy, 2, 0, Math.PI * 2); ctx.fill()
}

function HeroMaze() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return

    let rafId: number
    let t0: number | null = null
    const CELLS_PER_SEC = 7

    const setup = () => {
      const W = canvas.offsetWidth  || window.innerWidth
      const H = canvas.offsetHeight || window.innerHeight
      canvas.width  = W
      canvas.height = H
      const cols = Math.ceil(W / MAZE_CELL) + 2
      const rows = Math.ceil(H / MAZE_CELL) + 1
      const clampRow = (r: number) => Math.max(1, Math.min(rows - 2, r))

      const defs = [
        { startRow: clampRow(Math.floor(rows * 0.12)), delay: 0.2,  seed: 42  },
        { startRow: clampRow(Math.floor(rows * 0.30)), delay: 1.0,  seed: 137 },
        { startRow: clampRow(Math.floor(rows * 0.50)), delay: 1.8,  seed: 256 },
        { startRow: clampRow(Math.floor(rows * 0.68)), delay: 2.6,  seed: 512 },
        { startRow: clampRow(Math.floor(rows * 0.84)), delay: 3.4,  seed: 777 },
      ]
      const paths = defs.map(({ startRow, seed }) => mazeGenPath(cols, rows, startRow, seed))
      const ctx = canvas.getContext('2d')!

      const draw = (ts: number) => {
        if (!t0) t0 = ts
        const elapsed = (ts - t0) / 1000
        ctx.clearRect(0, 0, W, H)

        let allDone = true
        paths.forEach((path, i) => {
          const { delay } = defs[i]
          if (elapsed < delay) { allDone = false; return }
          const dt = elapsed - delay
          const progress = Math.min(path.length - 1, dt * CELLS_PER_SEC)
          if (progress < path.length - 1) allDone = false
          mazeDraw(ctx, path, progress, MAZE_CELL)
        })

        if (!allDone) rafId = requestAnimationFrame(draw)
      }

      rafId = requestAnimationFrame(draw)
    }

    setup()
    const onResize = () => { cancelAnimationFrame(rafId); t0 = null; setup() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} className="hero-maze-canvas" aria-hidden="true" />
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const STICKERS = [
  { id: 1, icon: '☕', label: 'Java',        pos: { top: '9%',     left: '52%'  } },
  { id: 2, icon: 'TS', label: 'TypeScript',  pos: { top: '6%',     right: '12%' } },
  { id: 3, icon: '🍃', label: 'Spring Boot', pos: { top: '34%',    right: '5%'  } },
  { id: 4, icon: '▲',  label: 'Next.js',     pos: { bottom: '32%', right: '10%' } },
  { id: 5, icon: '🐳', label: 'Docker',      pos: { bottom: '18%', left: '48%'  } },
  { id: 6, icon: '🗄️', label: 'PostgreSQL', pos: { bottom: '36%', left: '55%'  } },
]

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const THRESHOLD = 140
    const MAX_PUSH = 80
    const SPRING = 'translate 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'

    const origins = new Map<HTMLElement, { x: number; y: number }>()

    const cacheOrigins = () => {
      origins.clear()
      hero.querySelectorAll<HTMLElement>('.hero-sticker').forEach((el) => {
        const prev = el.style.translate
        el.style.translate = '0px 0px'
        const r = el.getBoundingClientRect()
        origins.set(el, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
        el.style.translate = prev
      })
    }

    const cacheTimer = setTimeout(cacheOrigins, 2200)
    window.addEventListener('resize', cacheOrigins)

    let rafId: number
    let mx = -9999
    let my = -9999

    const update = () => {
      hero.querySelectorAll<HTMLElement>('.hero-sticker').forEach((el) => {
        const o = origins.get(el)
        if (!o) return
        const dx = mx - o.x
        const dy = my - o.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < THRESHOLD && dist > 0) {
          const strength = (1 - dist / THRESHOLD) * MAX_PUSH
          const angle = Math.atan2(dy, dx)
          el.style.transition = 'none'
          el.style.translate = `${-Math.cos(angle) * strength}px ${-Math.sin(angle) * strength}px`
        } else {
          el.style.transition = SPRING
          el.style.translate = '0px 0px'
        }
      })
    }

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(update)
    }

    const onLeave = () => {
      mx = -9999
      my = -9999
      hero.querySelectorAll<HTMLElement>('.hero-sticker').forEach((el) => {
        el.style.transition = SPRING
        el.style.translate = '0px 0px'
      })
    }

    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseleave', onLeave)
    return () => {
      clearTimeout(cacheTimer)
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', cacheOrigins)
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section id="hero" className="hero" ref={heroRef}>
      <div className="hero__stars-a" aria-hidden="true" />
      <HeroMaze />
      <div className="hero__stars-b" aria-hidden="true" />

      {STICKERS.map((s) => (
        <div
          key={s.id}
          className={`hero-sticker hero-sticker--${s.id}`}
          style={s.pos}
          aria-hidden="true"
        >
          <span className="hero-sticker__icon">{s.icon}</span>
          <span>{s.label}</span>
        </div>
      ))}

      <div className="hero__inner">
        <p className="hero__eyebrow">NAIROBI, KENYA — AVAILABLE WORLDWIDE</p>
        <h1 className="hero__name">
          <span className="hero__line" aria-label="ENGINEER.">
            <ScrambleText text="ENGINEER." delay={500} duration={1400} />
          </span>
          <span className="hero__line" aria-label="LEARNER.">
            <ScrambleText text="LEARNER." delay={2000} duration={1100} />
          </span>
          <span className="hero__line" aria-label="PHILOSOPHER.">
            <ScrambleText text="PHILOSOPHER." delay={3200} duration={1500} />
          </span>
        </h1>
        <div className="hero__meta">
          <p className="hero__subtitle">Markian Mumba — Fullstack Developer</p>
          <p className="hero__desc">
            Building distributed systems and clean abstractions.
            <br />
            Java, Spring Boot, Next.js, TypeScript.
          </p>
        </div>
        <div className="hero__ctas">
          <a href="#projects" className="hero__cta hero__cta--primary">View Work ›</a>
          <a href="#contact" className="hero__cta hero__cta--ghost">Get in Touch ›</a>
        </div>
      </div>
      <div className="hero__scroll" aria-hidden="true">↓</div>
    </section>
  )
}
