import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getEssaysForHomepage, type EssayItem } from '../lib/contentful'
import { contentfulSrcSet, optimizeContentfulImageUrl } from '../lib/contentful-image'
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

function formatDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

function readingTime(article: unknown): number {
  const words = richTextToPlain(article).trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 230))
}

export default function Writing() {
  const ref = useReveal()
  const [essays, setEssays] = useState<EssayItem[]>([])

  useEffect(() => {
    getEssaysForHomepage().then((items) => setEssays(items.slice(0, 3)))
  }, [])

  return (
    <section id="writing" className="section writing-section" aria-labelledby="writing-title">
      <div className="container">
        <div ref={ref} className="reveal section-head section-head--row">
          <div>
            <h2 id="writing-title" className="section-head__title">Writing</h2>
            <p className="section-head__sub">Where I share what I'm learning and thinking about.</p>
          </div>
          <RouterLink to="/essays" className="btn btn--text">All essays</RouterLink>
        </div>

        <div className="writing-grid">
          {essays.map((essay) => {
            const title    = extractText(essay.title)
            const date     = formatDate(extractText(essay.publishDate as string))
            const category = extractText(essay.category) || 'Essay'
            const imgSrc   = essay.blogImage
              ? optimizeContentfulImageUrl(essay.blogImage, { width: 600, quality: 70 })
              : ''
            return (
              <RouterLink key={essay.id} to={`/essays/${essay.id}`} className="post-card">
                <div className="post-card__img">
                  {imgSrc && <img src={imgSrc} srcSet={contentfulSrcSet(essay.blogImage, [400, 600, 800], 60)} sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 410px" alt="" loading="lazy" decoding="async" />}
                </div>
                <span className="chip">{category}</span>
                <h3 className="post-card__title">{title}</h3>
                <p className="post-card__meta">
                  {date}{date ? ' • ' : ''}{readingTime(essay.article)}-minute read
                </p>
              </RouterLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
