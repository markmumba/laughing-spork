import { useEffect, useMemo, useState } from 'react'
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

// Snapshot items carry a precomputed `summary` instead of the article body
function readTime(essay: EssayItem): number {
  const words = essay.summary?.words
    ?? (richTextToPlain(essay.article) || extractText(essay.article)).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 230))
}

function getExcerpt(essay: EssayItem, chars = 200): string {
  const text = (essay.summary?.text ?? richTextToPlain(essay.article)).trim()
  if (!text) return ''
  return text.length > chars ? text.slice(0, chars).trimEnd() + '…' : text
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

// ─── Cards ────────────────────────────────────────────────────────────────────

function essayMeta(essay: EssayItem) {
  const date = formatDate(extractText(essay.publishDate as string))
  return `${date}${date ? ' • ' : ''}${readTime(essay)}-minute read`
}

function FeaturedEssay({ essay }: { essay: EssayItem }) {
  const title = extractText(essay.title)
  const author = extractText(essay.author) || 'Markian Mumba'
  const category = extractText(essay.category) || 'Essay'
  const excerpt = getExcerpt(essay, 180)
  const imgSrc = essay.blogImage ? optimizeContentfulImageUrl(essay.blogImage, { width: 800, quality: 70 }) : ''

  return (
    <article className="essay-feature">
      <div className="essay-feature__text">
        <span className="chip">{category}</span>
        <h2 className="essay-feature__title">
          <Link to={`/essays/${essay.id}`}>{title}</Link>
        </h2>
        {excerpt && <p className="essay-feature__excerpt">{excerpt}</p>}
        <p className="essay-feature__meta">By {author} • {readTime(essay)}-minute read</p>
        <Link to={`/essays/${essay.id}`} className="btn btn--text essay-feature__cta" tabIndex={-1} aria-hidden="true">Read article</Link>
      </div>
      <Link to={`/essays/${essay.id}`} className="essay-feature__media" tabIndex={-1} aria-hidden="true">
        {imgSrc && <img src={imgSrc} srcSet={contentfulSrcSet(essay.blogImage, [500, 800, 1000], 60)} sizes="(max-width: 900px) 100vw, 610px" alt="" decoding="async" fetchPriority="high" />}
      </Link>
    </article>
  )
}

function EssayCard({ essay }: { essay: EssayItem }) {
  const title = extractText(essay.title)
  const category = extractText(essay.category) || 'Essay'
  const imgSrc = essay.blogImage ? optimizeContentfulImageUrl(essay.blogImage, { width: 600, quality: 70 }) : ''

  return (
    <Link to={`/essays/${essay.id}`} className="post-card">
      <div className="post-card__img">
        {imgSrc && <img src={imgSrc} srcSet={contentfulSrcSet(essay.blogImage, [400, 600, 800], 60)} sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 410px" alt="" loading="lazy" decoding="async" />}
      </div>
      <span className="chip">{category}</span>
      <h3 className="post-card__title">{title}</h3>
      <p className="post-card__meta">{essayMeta(essay)}</p>
    </Link>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const PER_PAGE = 9

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  if (total <= 1) return null
  const pages = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <nav className="essays-pagination" aria-label="Page navigation">
      <button className="icon-btn" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z" /></svg>
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`essays-pagination__page${p === page ? ' is-current' : ''}`}
          onClick={() => onPage(p)}
          aria-current={p === page ? 'page' : undefined}
        >{p}</button>
      ))}
      <button className="icon-btn" disabled={page === total} onClick={() => onPage(page + 1)} aria-label="Next page">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" /></svg>
      </button>
    </nav>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EssaysPage() {
  usePageMeta({ title: 'Writing', description: 'Thoughts and ideas on distributed systems, engineering craft, and software philosophy.' })
  const [essays, setEssays] = useState<EssayItem[]>(() => readSnapshot() ?? [])
  const [loading, setLoading] = useState(() => essays.length === 0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Always refetch: picks up essays published after the last build. A failed fetch
  // returns [], which must not wipe a snapshot that already rendered.
  useEffect(() => {
    getEssays().then((data) => {
      if (data.length) setEssays(data)
      setLoading(false)
    })
  }, [])

  const categories = useMemo(
    () => [...new Set(essays.map((e) => extractText(e.category)).filter(Boolean))],
    [essays],
  )

  const browsing = !query && !category
  const [featured, ...others] = essays

  const filtered = (browsing ? others : essays).filter((e) => {
    if (category && extractText(e.category) !== category) return false
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
    document.getElementById('essays-all')?.scrollIntoView({ behavior: 'smooth' })
  }

  const pickCategory = (value: string | null) => {
    setCategory(value)
    setPage(1)
  }

  return (
    <div className="essays-page">
      <Nav page="essays" />

      <main>
        <header className="essays-hero">
          <h1 className="essays-hero__title">Writing</h1>
          <p className="essays-hero__sub">Thoughts on engineering, systems, and the craft of software.</p>
        </header>

        <div className={`essays-shell${loading ? ' essays-shell--loading' : ''}`}>
          {loading ? (
            <div className="essays-loading" role="status" aria-label="Loading articles" />
          ) : (
            <>
              {featured && browsing && page === 1 && <FeaturedEssay essay={featured} />}

              <section id="essays-all" className="essays-all" aria-labelledby="essays-all-title">
                <div className="essays-toolbar">
                  <h2 id="essays-all-title" className="essays-toolbar__title">
                    {browsing ? 'More articles' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
                  </h2>
                  <label className="essays-search">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14" /></svg>
                    <input
                      type="search"
                      name="search"
                      aria-label="Search articles"
                      autoComplete="off"
                      placeholder="Search articles"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value)
                        setPage(1)
                      }}
                    />
                  </label>
                </div>

                {categories.length > 1 && (
                  <div className="essays-filters" role="group" aria-label="Filter by category">
                    {[null, ...categories].map((value) => (
                      <button
                        key={value ?? 'all'}
                        type="button"
                        className={`filter-chip${category === value ? ' filter-chip--selected' : ''}`}
                        aria-pressed={category === value}
                        onClick={() => pickCategory(value)}
                      >
                        {category === value && (
                          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        )}
                        {value ?? 'All'}
                      </button>
                    ))}
                  </div>
                )}

                {filtered.length === 0 ? (browsing && featured ? null : (
                  <div className="essays-empty">
                    <h3>No articles found</h3>
                    <p>{query || category ? 'Try a different search or category.' : 'Check back soon.'}</p>
                  </div>
                )) : (
                  <div className="essays-grid">
                    {pageSlice.map((e) => <EssayCard key={e.id} essay={e} />)}
                  </div>
                )}

                <Pagination page={page} total={totalPages} onPage={handlePage} />
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
