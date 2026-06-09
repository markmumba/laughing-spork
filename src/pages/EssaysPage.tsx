import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEssays, type EssayItem } from '../lib/contentful'
import { optimizeContentfulImageUrl } from '../lib/contentful-image'

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

function formatDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function readTime(article: unknown): number {
  const text = richTextToPlain(article) || extractText(article)
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function getExcerpt(article: unknown, chars = 200): string {
  const text = richTextToPlain(article).trim()
  if (!text) return ''
  return text.length > chars ? text.slice(0, chars).trimEnd() + '…' : text
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({ essay }: { essay: EssayItem }) {
  const title = extractText(essay.title)
  const date = extractText(essay.publishDate as string)
  const category = extractText(essay.category)
  const mins = readTime(essay.article)
  const excerpt = getExcerpt(essay.article, 240)
  const imgSrc = essay.blogImage
    ? optimizeContentfulImageUrl(essay.blogImage, { width: 1200 })
    : ''

  return (
    <Link
      to={`/essays/${essay.id}`}
      className="essay-hero-card"
      style={imgSrc ? { backgroundImage: `url(${imgSrc})` } : undefined}
    >
      <div className="essay-hero-card__overlay" />
      <div className="essay-hero-card__content">
        {category && <p className="essay-hero-card__eyebrow">{category}</p>}
        <h2 className="essay-hero-card__title">{title}</h2>
        {excerpt && <p className="essay-hero-card__excerpt">{excerpt}</p>}
        <p className="essay-hero-card__meta">
          {formatDate(date)}
          {date && <span className="essay-item__meta-dot">·</span>}
          {mins} min read
        </p>
      </div>
    </Link>
  )
}

// ─── Article Row ─────────────────────────────────────────────────────────────

function EssayRow({ essay }: { essay: EssayItem }) {
  const title = extractText(essay.title)
  const date = extractText(essay.publishDate as string)
  const category = extractText(essay.category)
  const mins = readTime(essay.article)
  const excerpt = getExcerpt(essay.article)
  const imgSrc = essay.blogImage ? optimizeContentfulImageUrl(essay.blogImage, { width: 400 }) : ''

  return (
    <Link to={`/essays/${essay.id}`} className="essay-item">
      <div className="essay-item__content">
        {category && <p className="essay-item__eyebrow">{category}</p>}
        <h2 className="essay-item__title">{title}</h2>
        {excerpt && <p className="essay-item__excerpt">{excerpt}</p>}
        <div className="essay-item__meta">
          <span>{formatDate(date)}</span>
          <span className="essay-item__meta-dot">·</span>
          <span>{mins} min read</span>
          {essay.tags && essay.tags.length > 0 && (
            <>
              <span className="essay-item__meta-dot">·</span>
              <span className="essay-item__tag">{essay.tags[0]}</span>
            </>
          )}
        </div>
      </div>
      {imgSrc && (
        <div className="essay-item__image">
          <img src={imgSrc} alt={essay.blogImageAlt || title} loading="lazy" decoding="async" />
        </div>
      )}
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EssaysPage() {
  const [essays, setEssays] = useState<EssayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getEssays().then((data) => {
      setEssays(data)
      setLoading(false)
    })
  }, [])

  const filtered = essays.filter((e) => {
    if (!query) return true
    const title = extractText(e.title).toLowerCase()
    const tags = (e.tags ?? []).map((t) => t.toLowerCase())
    const q = query.toLowerCase()
    return title.includes(q) || tags.some((t) => t.includes(q))
  })

  const heroEssay = !query && filtered.length > 0 ? filtered[0] : null
  const listEssays = !query && filtered.length > 0 ? filtered.slice(1) : filtered

  return (
    <div className="essays-page">
      {/* Nav */}
      <nav className="essays-nav">
        <div className="essays-nav__inner">
          <Link to="/" className="essays-nav__logo">Markian.</Link>
          <Link to="/" className="essays-nav__back">← Home</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="essays-hero">
        <div className="container">
          <p className="section__eyebrow section__eyebrow--light">WRITING</p>
          <h1 className="essays-hero__title">
            Thoughts
            <br />
            &amp; ideas.
          </h1>
          <p className="essays-hero__sub">Where I share what I'm learning and thinking about.</p>
        </div>
      </header>

      {/* Search */}
      <div className="essays-search-bar">
        <div className="container">
          <input
            className="essays-search"
            type="search"
            placeholder="Search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <main className="essay-list">
        <div className="essay-list-container">
          {loading ? (
            <div className="essays-loading" />
          ) : filtered.length === 0 ? (
            <div className="essays-empty">
              <h3>No articles found.</h3>
              <p>{query ? 'Try a different search.' : 'Check back soon.'}</p>
            </div>
          ) : (
            <>
              {heroEssay && <HeroCard essay={heroEssay} />}
              {listEssays.map((e) => <EssayRow key={e.id} essay={e} />)}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__inner">
            <p className="footer__copy">© 2026 Markian Mumba. All rights reserved.</p>
            <div className="footer__links">
              <Link to="/">Home</Link>
              <a href="https://github.com/markmumba" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="mailto:mumbamarkian@gmail.com">Email</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
