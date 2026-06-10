import { useRef, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getEssaysForHomepage, type EssayItem } from '../lib/contentful'
import { optimizeContentfulImageUrl } from '../lib/contentful-image'
import { useReveal } from '../hooks/useReveal'
import './Writing.css'

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

function getExcerpt(article: unknown, chars = 220): string {
  const text = richTextToPlain(article).trim()
  if (!text) return ''
  return text.length > chars ? text.slice(0, chars).trimEnd() + '…' : text
}

function formatDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

export default function Writing() {
  const ref = useReveal()
  const [essays, setEssays] = useState<EssayItem[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getEssaysForHomepage().then(setEssays)
  }, [])

  const scrollToIdx = (idx: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[idx] as HTMLElement
    if (!card) return
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' })
    setActiveIdx(idx)
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (!track || !track.children[0]) return
    const cardWidth = (track.children[0] as HTMLElement).offsetWidth + 24
    setActiveIdx(Math.round(track.scrollLeft / cardWidth))
  }

  return (
    <section id="writing" className="section section--dark">
      <div className="container">
        <div ref={ref} className="reveal">
          <p className="section__eyebrow section__eyebrow--light">WRITING</p>
          <h2 className="section__headline">Thoughts &amp; ideas.</h2>
          <p className="section__sub">Where I share what I'm learning and thinking about.</p>
        </div>
      </div>

      <div className="writing-carousel-wrap" aria-live="polite" aria-atomic="false">
        <div className="writing-carousel" ref={trackRef} onScroll={handleScroll}>
          {essays.map((essay) => {
            const title    = extractText(essay.title)
            const date     = formatDate(extractText(essay.publishDate as string))
            const category = extractText(essay.category)
            const excerpt  = getExcerpt(essay.article)
            const imgSrc   = essay.blogImage
              ? optimizeContentfulImageUrl(essay.blogImage, { width: 900 })
              : ''
            return (
              <RouterLink
                key={essay.id}
                to={`/essays/${essay.id}`}
                className="writing-card writing-card--bg"
                style={imgSrc ? { backgroundImage: `url(${imgSrc})` } : undefined}
              >
                <div className="writing-card__overlay" />
                <div className="writing-card__text">
                  {(category || date) && (
                    <p className="writing-card__meta">
                      {category}{category && date ? ' · ' : ''}{date}
                    </p>
                  )}
                  <h3 className="writing-card__title">{title}</h3>
                  {excerpt && <p className="writing-card__excerpt">{excerpt}</p>}
                  <span className="writing-card__cta">Read article ›</span>
                </div>
              </RouterLink>
            )
          })}
        </div>

        {essays.length > 1 && (
          <div className="writing-carousel__dots">
            {essays.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot${i === activeIdx ? ' carousel-dot--active' : ''}`}
                onClick={() => scrollToIdx(i)}
                aria-label={`Article ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="container writing-carousel__footer">
        <RouterLink to="/essays" className="cta-link">All articles ›</RouterLink>
      </div>
    </section>
  )
}
