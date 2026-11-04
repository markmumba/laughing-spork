import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getLatestEssays, type EssayItem } from '../lib/contentful'
import Stepper from './Stepper'
import './Writing.css'

const SHOWN = 6

function extractText(rich: unknown): string {
  if (typeof rich === 'string') return rich
  if (rich && typeof rich === 'object' && 'content' in rich) {
    const r = rich as { content?: Array<{ content?: Array<{ value?: string }> }> }
    return r.content?.[0]?.content?.[0]?.value ?? ''
  }
  return ''
}

// Series essays open with "Over-Engineered on Purpose — Part 12: …" and a "This is Part 12 of
// a series…" recap; both repeat what the card already says, so the excerpt skips them
const SERIES_LINE = /—\s*Part \d+:|^This is Part \d+ of a series/

// Opening paragraphs of the essay, body text only (headings repeat the title)
function openingParagraphs(rich: unknown, chars = 1500): string[] {
  if (!rich || typeof rich !== 'object') return []
  const root = rich as { content?: Array<{ nodeType?: string }> }
  const parts: string[] = []
  let length = 0
  for (const block of root.content ?? []) {
    if (block.nodeType !== 'paragraph') continue
    const words: string[] = []
    const walk = (node: unknown) => {
      const n = node as { value?: unknown; content?: unknown[] }
      if (typeof n.value === 'string') words.push(n.value)
      if (Array.isArray(n.content)) n.content.forEach(walk)
    }
    walk(block)
    const text = words.join('').trim()
    if (!text || SERIES_LINE.test(text)) continue
    parts.push(text)
    length += text.length
    if (length > chars) break
  }
  return parts
}

// "02/2026", as the date reads on the cards
function monthSlashYear(raw: string): string {
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

// How far one page is from the next, as the track scrolls
function pageStep(track: HTMLElement): number {
  const first = track.firstElementChild as HTMLElement | null
  if (!first) return 1
  return first.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0)
}

// A deck of essay pages. The page at the column's edge is full size with its caption;
// the others shrink and fade with their distance from it, earlier ones spilling into the
// left margin. Scroll, swipe or drag with the mouse to bring the next one forward.
export default function Writing() {
  const trackRef = useRef<HTMLUListElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const swallowClick = useRef(false)
  const [essays, setEssays] = useState<EssayItem[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    getLatestEssays(SHOWN).then(({ items, total }) => {
      setTotal(total)
      setEssays(items)
    })
  }, [])

  // Each page's distance from the front, 0 to 1, drives its size and fade in the CSS
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    const paint = () => {
      frame = 0
      const at = track.scrollLeft / pageStep(track)
      Array.from(track.children).forEach((item, i) => {
        (item as HTMLElement).style.setProperty('--d', Math.min(Math.abs(i - at), 1).toFixed(3))
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    paint()
    track.addEventListener('scroll', schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(track)
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', schedule)
      observer.disconnect()
    }
  }, [essays])

  // Snapping is off while the mouse drags, and comes back once the glide to a page ends
  const glideTo = (index: number) => {
    const track = trackRef.current
    if (!track) return
    const last = track.children.length - 1
    const left = Math.max(0, Math.min(index, last)) * pageStep(track)
    track.classList.add('is-gliding')
    track.scrollTo({ left, behavior: 'smooth' })
    const settle = () => track.classList.remove('is-gliding')
    track.addEventListener('scrollend', settle, { once: true })
    window.setTimeout(settle, 700)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved) {
      if (Math.abs(dx) < 4) return
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
      e.currentTarget.classList.add('is-dragging', 'is-gliding')
    }
    e.currentTarget.scrollLeft = d.left - dx
  }

  const onPointerUp = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    const track = e.currentTarget
    track.classList.remove('is-dragging')
    swallowClick.current = true
    // A short flick is enough to turn the page
    const step = pageStep(track)
    const from = Math.round(d.left / step)
    const moved = (track.scrollLeft - d.left) / step
    glideTo(Math.abs(moved) < 0.15 ? from : from + Math.sign(moved) * Math.max(1, Math.round(Math.abs(moved))))
  }

  // A drag isn't a click, and clicking a page behind the front one brings it forward
  const onClickCapture = (e: React.MouseEvent<HTMLUListElement>) => {
    const track = e.currentTarget
    const item = (e.target as HTMLElement).closest('li')
    const index = item ? Array.from(track.children).indexOf(item) : -1
    const front = Math.round(track.scrollLeft / pageStep(track))
    if (swallowClick.current || (index >= 0 && index !== front)) {
      e.preventDefault()
      e.stopPropagation()
      if (!swallowClick.current) glideTo(index)
    }
    swallowClick.current = false
  }

  return (
    <section id="writing" className="block" aria-labelledby="writing-title">
      <div className="label-row">
        <h2 id="writing-title" className="label">Writing</h2>
        <Stepper track={trackRef} label="Scroll essays" />
      </div>

      <ul
        ref={trackRef}
        className="deck"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {essays.map((essay) => {
          const title = extractText(essay.title)
          const date = monthSlashYear(extractText(essay.publishDate as string))
          return (
            <li key={essay.id} className="deck__item">
              <RouterLink to={`/essays/${essay.id}`} className="deck__link" draggable={false}>
                <div className="deck__page" aria-hidden="true">
                  <p className="deck__page-title">{title}</p>
                  <p className="deck__page-date">{date}</p>
                  {openingParagraphs(essay.article).map((text, i) => (
                    <p key={i} className="deck__page-text">{text}</p>
                  ))}
                </div>
                <div className="deck__caption">
                  <span className="deck__title">{title}</span>
                  <span className="deck__date">{date}</span>
                </div>
              </RouterLink>
            </li>
          )
        })}
        {essays.length > 0 && (
          <li className="deck__item">
            <RouterLink to="/essays" className="deck__link" draggable={false}>
              <div className="deck__page deck__page--all">
                <span>All {total} essays</span>
                <span className="muted">Fly through them →</span>
              </div>
            </RouterLink>
          </li>
        )}
      </ul>
    </section>
  )
}
