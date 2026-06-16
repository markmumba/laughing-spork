import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEssays, type EssayItem } from '../lib/contentful'
import { optimizeContentfulImageUrl } from '../lib/contentful-image'
import { usePageMeta } from '../lib/usePageMeta'
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

function formatDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'long',
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

// ─── Article Card ─────────────────────────────────────────────────────────────

function EssayCard({ essay, index }: { essay: EssayItem; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const title = extractText(essay.title)
  const date = extractText(essay.publishDate as string)
  const category = extractText(essay.category)
  const author = extractText(essay.author)
  const mins = readTime(essay.article)
  const excerpt = getExcerpt(essay.article, 220)
  const imgSrc = essay.blogImage
    ? optimizeContentfulImageUrl(essay.blogImage, { width: 800 })
    : ''

  return (
    <Link
      to={`/essays/${essay.id}`}
      className="essay-card"
      ref={ref}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      {/* Col 1 — rows 1-4 */}
      {category
        ? <span className="essay-card__category">{category}</span>
        : <span />
      }
      <h3 className="essay-card__title">{title}</h3>
      <div className="essay-card__body">
        {excerpt && <p className="essay-card__excerpt">{excerpt}</p>}
        <span className="essay-card__read-more">Read more →</span>
      </div>

      {/* Col 2 — meta spans rows 1-2, image starts at row 3 (excerpt level) */}
      <div className="essay-card__right-meta">
        {author && (
          <div className="essay-card__author-row">
            <span className="essay-card__avatar" aria-hidden="true">
              {author.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
            <span className="essay-card__author">{author}</span>
          </div>
        )}
        <span className="essay-card__date-time">
          {formatDate(date)}
          {date && <span className="essay-card__dot">·</span>}
          {mins} min read
        </span>
      </div>
      {imgSrc && (
        <img
          src={imgSrc}
          alt={essay.blogImageAlt || title}
          loading="lazy"
          decoding="async"
          className="essay-card__img"
        />
      )}
    </Link>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const PER_PAGE = 8

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  if (total <= 1) return null
  const pages = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <nav className="essays-pagination" aria-label="Page navigation">
      <button className="essays-pagination__btn" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page">←</button>
      {pages.map((p) => (
        <button
          key={p}
          className={`essays-pagination__btn${p === page ? ' essays-pagination__btn--active' : ''}`}
          onClick={() => onPage(p)}
          aria-current={p === page ? 'page' : undefined}
        >{p}</button>
      ))}
      <button className="essays-pagination__btn" disabled={page === total} onClick={() => onPage(page + 1)} aria-label="Next page">→</button>
    </nav>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EssaysPage() {
  usePageMeta({ title: 'Writing', description: 'Thoughts and ideas on distributed systems, engineering craft, and software philosophy.' })
  const [essays, setEssays] = useState<EssayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getEssays().then((data) => {
      setEssays(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => { setPage(1) }, [query])

  const filtered = essays.filter((e) => {
    if (!query) return true
    const title = extractText(e.title).toLowerCase()
    const tags = (e.tags ?? []).map((t) => t.toLowerCase())
    const q = query.toLowerCase()
    return title.includes(q) || tags.some((t) => t.includes(q))
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const pageSlice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handlePage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="essays-page">
      {/* Nav */}
      <nav className="essays-nav">
        <div className="essays-nav__inner">
          <Link to="/" className="essays-nav__logo">Markian.</Link>
          <Link to="/" className="essays-nav__back">← Home</Link>
        </div>
      </nav>

      {/* Page Header */}
      <header className="essays-header">
        <div className="essays-header__inner">
          <h1 className="essays-header__title">Writing</h1>
          <p className="essays-header__sub">Thoughts on engineering, systems, and the craft of software.</p>
        </div>
      </header>

      {/* Search */}
      <div className="essays-search-bar">
        <div className="essays-search-inner">
          <input
            className="essays-search"
            type="search"
            name="search"
            aria-label="Search articles"
            autoComplete="off"
            placeholder="Search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <main className="essay-list">
        <div className="essay-list-inner">
          {loading ? (
            <div className="essays-loading" />
          ) : filtered.length === 0 ? (
            <div className="essays-empty">
              <h3>No articles found.</h3>
              <p>{query ? 'Try a different search.' : 'Check back soon.'}</p>
            </div>
          ) : (
            <div className="essays-article-list">
              {pageSlice.map((e, i) => <EssayCard key={e.id} essay={e} index={i} />)}
            </div>
          )}
          {!loading && totalPages > 1 && (
            <Pagination page={page} total={totalPages} onPage={handlePage} />
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
