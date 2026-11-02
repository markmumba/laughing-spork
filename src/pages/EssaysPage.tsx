import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEssays, type EssayItem } from '../lib/contentful'
import { contentfulSrcSet, optimizeContentfulImageUrl } from '../lib/contentful-image'
import { usePageMeta } from '../lib/usePageMeta'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import './EssaysPage.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractText(rich: unknown): string {
  if (typeof rich === 'string') return rich
  if (rich && typeof rich === 'object' && 'content' in rich) {
    const r = rich as { content?: Array<{ content?: Array<{ value?: string }> }> }
    return r.content?.[0]?.content?.[0]?.value ?? ''
  }
  return ''
}

function richTextToPlain(rich: unknown): string {
  if (!rich || typeof rich !== 'object') return ''
  const root = rich as { content?: unknown[] }
  const parts: string[] = []
  const walk = (node: unknown) => {
    if (!node) return
    const n = node as { value?: unknown; content?: unknown[] }
    if (typeof n.value === 'string') parts.push(n.value)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  if (Array.isArray(root.content)) root.content.forEach(walk)
  return parts.join(' ')
}

// Snapshot items carry a precomputed `summary` instead of the article body
function readTime(essay: EssayItem): number {
  const words = essay.summary?.words
    ?? (richTextToPlain(essay.article) || extractText(essay.article)).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 230))
}

// Essay list baked into /essays/index.html at build time (see server/route-html.ts).
// Absent when the page is reached by client-side navigation or in dev.
function readSnapshot(): EssayItem[] | null {
  const el = document.getElementById('essays-snapshot')
  if (!el?.textContent) return null
  try {
    const items = JSON.parse(el.textContent) as EssayItem[]
    return Array.isArray(items) && items.length ? items : null
  } catch {
    return null
  }
}

// ─── Fly-through: essays scattered in depth, scroll moves the camera forward ──

const TUNNEL_GAP = 450   // depth between consecutive cards (px)
const TUNNEL_FAR = 1800  // how deep the first card starts
const TUNNEL_NEAR = 700  // depth past the camera where a card is gone
const TUNNEL_HAZE = 2600 // depth range over which far cards fade in
const TUNNEL_BLUR = 16   // blur (px) on the farthest visible cards
const PERSPECTIVE = 900  // must match .essay-tunnel__stage perspective

// Golden-angle scatter keeps cards off the centre line so they fly past the
// viewer rather than through them. Values are fractions of the viewport.
function scatter(i: number) {
  const angle = i * 2.39996
  const r = 0.62 + ((i * 7) % 5) * 0.08
  return { x: Math.cos(angle) * r * 0.36, y: Math.sin(angle) * r * 0.3 }
}

// A mix of portrait, square and landscape frames, so the field doesn't read as a grid.
// `w` scales the base card width to keep each shape's area roughly even.
const SHAPES = [
  { w: 1, ratio: '4 / 3' },
  { w: 0.78, ratio: '3 / 4' },
  { w: 0.9, ratio: '1 / 1' },
  { w: 1.15, ratio: '16 / 10' },
  { w: 0.82, ratio: '4 / 5' },
]

function getExcerpt(essay: EssayItem, chars = 220): string {
  const text = (essay.summary?.text ?? richTextToPlain(essay.article)).trim()
  if (!text) return ''
  return text.length > chars ? text.slice(0, chars).trimEnd() + '…' : text
}

function essayImage(essay: EssayItem, width: number) {
  return essay.blogImage ? optimizeContentfulImageUrl(essay.blogImage, { width, quality: 70 }) : ''
}

function EssayPeek({ essay, onClose }: { essay: EssayItem; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // showModal gives us the focus trap, Esc to close and focus return for free
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    const root = document.documentElement
    root.style.overflow = 'hidden'
    // No dialog.close() here: its close event would call onClose during a
    // StrictMode remount, and unmounting takes the dialog away regardless
    return () => { root.style.overflow = '' }
  }, [])

  const imgSrc = essayImage(essay, 1000)
  const excerpt = getExcerpt(essay)

  return (
    <dialog
      ref={dialogRef}
      className="essay-peek"
      aria-labelledby="essay-peek-title"
      onClose={onClose}
      // A click on the dialog itself (not its content) is a click on the backdrop
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="essay-peek__body">
        {imgSrc && <img className="essay-peek__img" src={imgSrc} srcSet={contentfulSrcSet(essay.blogImage, [600, 1000, 1400], 70)} sizes="(max-width: 760px) 100vw, 720px" alt="" />}
        <p className="essay-peek__meta">{extractText(essay.category) || 'Essay'} • {readTime(essay)}-minute read</p>
        <h2 id="essay-peek-title" className="essay-peek__title">{extractText(essay.title)}</h2>
        {excerpt && <p className="essay-peek__excerpt">{excerpt}</p>}
        <Link to={`/essays/${essay.id}`} className="btn btn--filled essay-peek__cta">Read article</Link>
      </div>
      <button type="button" className="icon-btn essay-peek__close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
      </button>
    </dialog>
  )
}

function EssayTunnel({ essays, children }: { essays: EssayItem[]; children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [peek, setPeek] = useState<EssayItem | null>(null)
  const travel = (essays.length - 1) * TUNNEL_GAP + TUNNEL_FAR + TUNNEL_NEAR

  useEffect(() => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0

    const render = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable))
      // Narrow screens need a wider spread, or the cards stack on top of each other
      const w = window.innerWidth * (window.innerWidth < 640 ? 1.5 : 1)
      const h = window.innerHeight

      // The title floats over the field and clears out over the first stretch of flight
      const intro = introRef.current
      if (intro) {
        const fade = Math.min(1, (progress * travel) / 900)
        intro.style.opacity = String(1 - fade)
        intro.style.transform = `translateY(${fade * -40}px)`
      }

      cardRefs.current.forEach((card, i) => {
        if (!card) return
        // Cards that have flown past park just behind the camera, fully faded
        const z = Math.min(TUNNEL_NEAR, -TUNNEL_FAR - i * TUNNEL_GAP + progress * travel)
        // Far cards emerge from a haze, so the first few already show on arrival
        const fadeIn = Math.min(1, (z + TUNNEL_FAR + TUNNEL_HAZE) / TUNNEL_HAZE)
        const fadeOut = Math.min(1, Math.max(0, (TUNNEL_NEAR - z) / 450))
        const opacity = Math.max(0, Math.min(fadeIn, fadeOut))
        // ...and come into focus as they approach: sharp from 600px out
        const blur = Math.max(0, Math.min(1, (-z - 600) / (TUNNEL_FAR + TUNNEL_HAZE - 600))) * TUNNEL_BLUR
        // Perspective would pull distant cards into a clump at the centre; partly
        // undo it so the field stays spread across the screen at every depth
        const spread = ((PERSPECTIVE - z) / PERSPECTIVE) ** 0.7
        const { x, y } = scatter(i)
        card.style.transform = `translate3d(${x * w * spread}px, ${y * h * spread}px, ${z}px) translate(-50%, -50%)`
        card.style.opacity = String(opacity)
        card.style.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : ''
        card.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none'
      })
    }

    const schedule = () => { if (!frame) frame = requestAnimationFrame(render) }
    render()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [travel])

  // Tabbing to a card flies the camera to it, so keyboard users can reach every essay.
  // Mouse focus is skipped: the card is already in view, and the jump would be jarring.
  const flyTo = (card: HTMLElement, i: number) => {
    const section = sectionRef.current
    if (!section || !card.matches(':focus-visible') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const progress = (TUNNEL_FAR + i * TUNNEL_GAP - 150) / travel
    const top = section.offsetTop + progress * (section.offsetHeight - window.innerHeight)
    window.scrollTo({ top, behavior: 'instant' })
  }

  return (
    <section
      ref={sectionRef}
      className="essay-tunnel"
      style={{ '--tunnel-count': essays.length } as React.CSSProperties}
      aria-label="Essays"
    >
      <div className="essay-tunnel__stage">
        <div ref={introRef} className="essay-tunnel__intro">{children}</div>
        <p className="essay-tunnel__hint" aria-hidden="true">Scroll to fly through · Select to look closer</p>
        {essays.map((essay, i) => {
          const imgSrc = essayImage(essay, 600)
          const shape = SHAPES[(i * 3) % SHAPES.length]
          return (
            <Link
              key={essay.id}
              ref={(el) => { cardRefs.current[i] = el }}
              to={`/essays/${essay.id}`}
              className="essay-tunnel__card"
              // Card i is always nearer than card i + 1, so it must paint on top
              style={{ zIndex: essays.length - i, '--shape-w': shape.w, '--shape-ratio': shape.ratio } as React.CSSProperties}
              onFocus={(e) => flyTo(e.currentTarget, i)}
              onClick={(e) => {
                // Let modified clicks open the article in a new tab as usual
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                e.preventDefault()
                setPeek(essay)
              }}
            >
              {imgSrc && <img src={imgSrc} srcSet={contentfulSrcSet(essay.blogImage, [400, 600, 800], 60)} sizes="300px" alt="" decoding="async" />}
              <span className="essay-tunnel__title">{extractText(essay.title)}</span>
            </Link>
          )
        })}
      </div>
      {peek && <EssayPeek essay={peek} onClose={() => setPeek(null)} />}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EssaysPage() {
  usePageMeta({ title: 'Writing', description: 'Thoughts and ideas on distributed systems, engineering craft, and software philosophy.' })
  const [essays, setEssays] = useState<EssayItem[]>(() => readSnapshot() ?? [])
  const [loading, setLoading] = useState(() => essays.length === 0)

  // Always refetch: picks up essays published after the last build. A failed fetch
  // returns [], which must not wipe a snapshot that already rendered.
  useEffect(() => {
    getEssays().then((data) => {
      if (data.length) setEssays(data)
      setLoading(false)
    })
  }, [])

  const hero = (
    <header className="essays-hero">
      <h1 className="essays-hero__title">Writing</h1>
      <p className="essays-hero__sub">Thoughts on engineering, systems, and the craft of software.</p>
    </header>
  )

  return (
    <div className="essays-page">
      <Nav page="essays" />

      <main>
        {!loading && essays.length ? (
          <EssayTunnel essays={essays}>{hero}</EssayTunnel>
        ) : (
          <>
            {hero}
            {loading ? (
              <div className="essays-shell--loading">
                <div className="essays-loading" role="status" aria-label="Loading articles" />
              </div>
            ) : (
              <div className="essays-empty">
                <h2>No articles yet</h2>
                <p>Check back soon.</p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
