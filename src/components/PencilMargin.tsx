import { useEffect, useRef, useState, type RefObject } from 'react'
import { getEssayNuggets, type EssayNugget } from '../lib/contentful'
import font from '../lib/pencil-font.json'
import './PencilMargin.css'

// A graphite line drawn down the left margin as you scroll, which pauses at a few gaps
// between sections to write a short quote from the essays in single-stroke handwriting.
// Desktop only (it needs an empty margin); a still, finished drawing under reduced motion.

type Point = [number, number]
type Stroke = Point[]

const WIDE_ENOUGH = '(min-width: 1200px)'
const LINE_OFFSET = 56      // line sits this far left of the column
const NOTE_GAP = 26         // space between a note and the line
const NOTE_MAX_WIDTH = 210
const MAX_QUOTE = 100       // longer nuggets don't fit a margin note
const NOTES = 3
const QUOTE_SIZE = 22       // em size (px) of the quote handwriting
const AUTHOR_SIZE = 16
const WRITE_SPAN = 320      // px of scrolling it takes to write one note
const PEN_AT = 0.6          // the pen sits this far down the viewport

// Each entry is [advance width, path data] in 1000-unit em space; spaces have no path
const glyphs = font as unknown as Record<string, [number, string?]>

// ─── Geometry ─────────────────────────────────────────────────────────────────

// Small deterministic noise, so the line wobbles the same way on every render
function wobble(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s) - 0.5
}

// The same noise eased between whole numbers, for a hand's slow drift rather than a jitter
function drift(t: number): number {
  const i = Math.floor(t)
  const f = (1 - Math.cos((t - i) * Math.PI)) / 2
  return wobble(i) * (1 - f) + wobble(i + 1) * f
}

// Curly punctuation the font doesn't have, mapped to what it does
const SUBSTITUTE: Record<string, string> = { '’': "'", '‘': "'", '“': '"', '”': '"', '—': '-', '–': '-', '…': '...' }

function glyphFor(ch: string) {
  return glyphs[SUBSTITUTE[ch] ?? ch] ?? glyphs[' ']
}

function textWidth(text: string, scale: number): number {
  let w = 0
  for (const ch of text) w += glyphFor(ch)[0] * scale
  return w
}

// Lay text out in lines no wider than `width`, then turn each glyph into strokes
function writeText(text: string, x: number, y: number, size: number, width: number, lineHeight: number): { strokes: Stroke[]; height: number } {
  const scale = size / 1000
  const words = text.replace(/\s+/g, ' ').split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (line && textWidth(test, scale) > width) { lines.push(line); line = word } else line = test
  }
  if (line) lines.push(line)

  const strokes: Stroke[] = []
  lines.forEach((ln, row) => {
    let gx = x
    const baseline = y + size * 0.8 + row * lineHeight
    for (const ch of ln) {
      const [adv, d] = glyphFor(ch)
      if (d) {
        // Paths are only M and L commands: each M starts a new stroke
        for (const part of d.split('M').filter(Boolean)) {
          const nums = part.replace(/L/g, ' ').trim().split(/\s+/).map(Number)
          const stroke: Stroke = []
          for (let i = 0; i + 1 < nums.length; i += 2) stroke.push([gx + nums[i] * scale, baseline - nums[i + 1] * scale])
          if (stroke.length > 1) strokes.push(stroke)
        }
      }
      gx += adv * scale
    }
  })
  return { strokes, height: lines.length * lineHeight }
}

// The margin line: a slight wobble straight down, with a little loop at each section label
function drawLine(x: number, top: number, bottom: number, loops: number[]): Stroke {
  const pts: Stroke = []
  let y = top
  let n = 0
  const pending = loops.filter((ly) => ly > top && ly < bottom).sort((a, b) => a - b)
  while (y < bottom) {
    if (pending.length && y >= pending[0]) {
      const ly = pending.shift()!
      // A small anticlockwise loop off to the left, like a pencil circling a heading
      for (let t = 0; t <= 1.0001; t += 1 / 28) {
        const a = Math.PI / 2 + t * Math.PI * 2
        pts.push([x - 9 + Math.cos(a) * -9 + wobble(ly + t) * 0.6, ly + Math.sin(a) * -7 + t * 10])
      }
      y = ly + 10
      continue
    }
    pts.push([x + drift(y / 80) * 5 + wobble(n) * 0.35, y])
    y += 6
    n++
  }
  return pts
}

function length(stroke: Stroke): number {
  let l = 0
  for (let i = 1; i < stroke.length; i++) l += Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1])
  return l
}

function pointAt(stroke: Stroke, at: number): Point {
  let l = 0
  for (let i = 1; i < stroke.length; i++) {
    const seg = Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1])
    if (l + seg >= at) {
      const t = seg ? (at - l) / seg : 0
      return [stroke[i - 1][0] + (stroke[i][0] - stroke[i - 1][0]) * t, stroke[i - 1][1] + (stroke[i][1] - stroke[i - 1][1]) * t]
    }
    l += seg
  }
  return stroke[stroke.length - 1]
}

const toPath = (s: Stroke) => 'M' + s.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')

// ─── Layout from the page ─────────────────────────────────────────────────────

// `authorFrom` is the index of the first stroke of the author line, drawn lighter
type Note = { y: number; strokes: Stroke[]; lengths: number[]; total: number; authorFrom: number }
type Drawing = { width: number; height: number; line: Stroke; lineLength: number; notes: Note[] }

function shortNuggets(all: EssayNugget[]): EssayNugget[] {
  const seen = new Set<string>()
  const short = all.filter((n) => {
    const key = n.quote.toLowerCase().replace(/[^a-z]/g, '').slice(0, 40)
    if (n.quote.length > MAX_QUOTE || seen.has(key)) return false
    seen.add(key)
    return true
  })
  // A different few on every visit
  for (let i = short.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[short[i], short[j]] = [short[j], short[i]]
  }
  return short.slice(0, NOTES)
}

function layout(root: HTMLElement, nuggets: EssayNugget[]): Drawing | null {
  const blocks = [...root.querySelectorAll<HTMLElement>('main .block')]
  if (blocks.length < 3) return null
  const base = root.getBoundingClientRect()
  const rel = (el: Element) => {
    const r = el.getBoundingClientRect()
    return { top: r.top - base.top, bottom: r.bottom - base.top, left: r.left - base.left }
  }

  const lineX = rel(blocks[0]).left - LINE_OFFSET
  const noteWidth = Math.min(NOTE_MAX_WIDTH, lineX - NOTE_GAP - 24)
  if (noteWidth < 140) return null

  const top = rel(blocks[0]).top + 6
  const bottom = rel(blocks[blocks.length - 1]).bottom
  const loops = [...root.querySelectorAll('main .label')].map((el) => rel(el).top + 12)
  const line = drawLine(lineX, top, bottom, loops)

  // Notes go in the gaps after "Now", in the middle of the page, and before Writing ends
  const gaps = blocks.slice(1, -1).map((b) => rel(b).bottom + 24)
  const slots = [0, Math.floor(gaps.length / 2), gaps.length - 2].filter((v, i, a) => v >= 0 && a.indexOf(v) === i)
  const notes = nuggets.slice(0, slots.length).map((n, i) => {
    const y = gaps[slots[i]]
    const x = lineX - NOTE_GAP - noteWidth
    const quote = writeText(n.quote, x, y, QUOTE_SIZE, noteWidth, 24)
    const author = n.author ? writeText(`- ${n.author}`, x, y + quote.height + 6, AUTHOR_SIZE, noteWidth, 18).strokes : []
    const strokes = [...quote.strokes, ...author]
    const lengths = strokes.map(length)
    return { y, strokes, lengths, total: lengths.reduce((a, b) => a + b, 0), authorFrom: quote.strokes.length }
  })

  return { width: base.width, height: base.height, line, lineLength: length(line), notes }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PencilMargin({ root }: { root: RefObject<HTMLElement | null> }) {
  const [nuggets, setNuggets] = useState<EssayNugget[]>([])
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const lineRef = useRef<SVGPathElement>(null)
  const noteRefs = useRef<(SVGPathElement | null)[][]>([])
  const tipRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!window.matchMedia(WIDE_ENOUGH).matches) return
    let cancelled = false
    getEssayNuggets().then((all) => { if (!cancelled) setNuggets(shortNuggets(all)) })
    return () => { cancelled = true }
  }, [])

  // Re-measure whenever the page changes size (carousels and essays load in after paint)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const wide = window.matchMedia(WIDE_ENOUGH)
    const measure = () => setDrawing(wide.matches ? layout(el, nuggets) : null)
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    wide.addEventListener('change', measure)
    return () => {
      observer.disconnect()
      wide.removeEventListener('change', measure)
    }
  }, [root, nuggets])

  // Drive the drawing from the scroll position
  useEffect(() => {
    const el = root.current
    if (!drawing || !el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    const render = () => {
      frame = 0
      const penY = still ? Infinity : window.innerHeight * PEN_AT - el.getBoundingClientRect().top
      let tip: Point | null = null

      // Line: drawn down to the pen, measured by the furthest point reached so far
      let drawn = 0
      let reach = -Infinity
      for (let i = 1; i < drawing.line.length; i++) {
        reach = Math.max(reach, drawing.line[i][1])
        if (reach > penY) break
        drawn += Math.hypot(drawing.line[i][0] - drawing.line[i - 1][0], drawing.line[i][1] - drawing.line[i - 1][1])
      }
      lineRef.current?.style.setProperty('stroke-dashoffset', String(drawing.lineLength - drawn))
      if (drawn > 0 && drawn < drawing.lineLength) tip = pointAt(drawing.line, drawn)

      // Notes: written stroke by stroke over WRITE_SPAN px of scrolling once the pen reaches them
      drawing.notes.forEach((note, n) => {
        const progress = Math.max(0, Math.min(1, (penY - note.y) / WRITE_SPAN))
        let left = progress * note.total
        note.strokes.forEach((stroke, s) => {
          const len = note.lengths[s]
          const show = Math.max(0, Math.min(len, left))
          left -= len
          const path = noteRefs.current[n]?.[s]
          path?.style.setProperty('stroke-dashoffset', String(len - show))
          // Round caps paint a dot even for a zero-length dash, so unstarted strokes hide
          path?.style.setProperty('visibility', show > 0 ? 'visible' : 'hidden')
          if (show > 0 && show < len) tip = pointAt(stroke, show)
        })
      })

      const dot = tipRef.current
      if (dot) {
        dot.style.opacity = tip && !still ? '1' : '0'
        if (tip) dot.setAttribute('transform', `translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)})`)
      }
    }

    const schedule = () => { if (!frame) frame = requestAnimationFrame(render) }
    render()
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
    }
  }, [root, drawing])

  if (!drawing) return null

  return (
    <svg className="pencil-margin" width={drawing.width} height={drawing.height} viewBox={`0 0 ${drawing.width} ${drawing.height}`} aria-hidden="true">
      <path ref={lineRef} className="pencil-margin__line" d={toPath(drawing.line)} strokeDasharray={drawing.lineLength} strokeDashoffset={drawing.lineLength} />
      {drawing.notes.map((note, n) => (
        <g key={n} className="pencil-margin__note">
          {note.strokes.map((stroke, s) => (
            <path
              key={s}
              ref={(p) => { (noteRefs.current[n] ??= [])[s] = p }}
              d={toPath(stroke)}
              className={s >= note.authorFrom ? 'is-author' : undefined}
              strokeDasharray={note.lengths[s]}
              strokeDashoffset={note.lengths[s]}
            />
          ))}
        </g>
      ))}
      <circle ref={tipRef} className="pencil-margin__tip" r="2.4" />
    </svg>
  )
}
