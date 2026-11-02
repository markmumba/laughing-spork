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
const PERSPECTIVE = 900  // must match .essay-tunnel__stage perspective

// Golden-angle scatter keeps cards off the centre line so they fly past the
// viewer rather than through them. Values are fractions of the viewport.
function scatter(i: number) {
  const angle = i * 2.39996
  const r = 0.62 + ((i * 7) % 5) * 0.08
  return { x: Math.cos(angle) * r * 0.36, y: Math.sin(angle) * r * 0.3 }
}

function EssayTunnel({ essays, children }: { essays: EssayItem[]; children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
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
        // Perspective would pull distant cards into a clump at the centre; partly
        // undo it so the field stays spread across the screen at every depth
        const spread = ((PERSPECTIVE - z) / PERSPECTIVE) ** 0.7
        const { x, y } = scatter(i)
        card.style.transform = `translate3d(${x * w * spread}px, ${y * h * spread}px, ${z}px)`
        card.style.opacity = String(opacity)
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

  // Tabbing to a card flies the camera to it, so keyboard users can reach every essay
  const flyTo = (i: number) => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
        <p className="essay-tunnel__hint" aria-hidden="true">Scroll to fly through</p>
        {essays.map((essay, i) => {
          const imgSrc = essay.blogImage ? optimizeContentfulImageUrl(essay.blogImage, { width: 600, quality: 70 }) : ''
          const category = extractText(essay.category) || 'Essay'
          return (
            <Link
              key={essay.id}
              ref={(el) => { cardRefs.current[i] = el }}
              to={`/essays/${essay.id}`}
              className="essay-tunnel__card"
              // Card i is always nearer than card i + 1, so it must paint on top
              style={{ zIndex: essays.length - i }}
              onFocus={() => flyTo(i)}
            >
              {imgSrc && <img src={imgSrc} srcSet={contentfulSrcSet(essay.blogImage, [400, 600, 800], 60)} sizes="300px" alt="" decoding="async" />}
              <span className="essay-tunnel__meta">{category} • {readTime(essay)}-minute read</span>
              <span className="essay-tunnel__title">{extractText(essay.title)}</span>
            </Link>
          )
        })}
      </div>
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
