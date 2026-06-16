import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEssayById, type EssayItem } from '../lib/contentful'
import RichTextRenderer from '../lib/richtext'
import './ArticlePage.css'
import { usePageMeta } from '../lib/usePageMeta'
import type { Document } from '@contentful/rich-text-types'

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
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200))
}

// ─── Share Bar ────────────────────────────────────────────────────────────────

function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(window.location.href)}`

  return (
    <div className="share-bar">
      <span className="share-bar__label">Share</span>
      <div className="share-bar__actions">
        {/* X / Twitter */}
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="share-btn" aria-label="Share on X">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.734l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        {/* Email */}
        <a href={emailUrl} className="share-btn" aria-label="Share via email">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </a>
        {/* Copy link */}
        <button onClick={handleCopy} className={`share-btn${copied ? ' share-btn--copied' : ''}`} aria-label="Copy link">
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          )}
          <span className="share-btn__label">{copied ? 'Copied!' : 'Copy link'}</span>
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [essay, setEssay] = useState<EssayItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const metaTitle = essay ? extractText(essay.title) : 'Article'
  const metaDesc = essay ? richTextToPlain(essay.article).slice(0, 160).trimEnd() : undefined
  usePageMeta({ title: metaTitle, description: metaDesc, image: essay?.blogImage || undefined })

  useEffect(() => {
    if (!id) return
    window.scrollTo(0, 0)
    setLoading(true)
    getEssayById(id).then((data) => {
      if (!data) setNotFound(true)
      else setEssay(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="article-page">
        <ArticleNav title="" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
          <div className="essays-loading" />
        </div>
      </div>
    )
  }

  if (notFound || !essay) {
    return (
      <div className="article-page">
        <ArticleNav title="" />
        <div className="articles-not-found">
          <h1>Article not found.</h1>
          <p>It may have been moved or doesn't exist.</p>
          <Link to="/essays" className="cta-link">← All Writing</Link>
        </div>
      </div>
    )
  }

  const title = extractText(essay.title)
  const author = extractText(essay.author) || 'Markian Mumba'
  const date = extractText(essay.publishDate as string)
  const category = extractText(essay.category)
  const mins = readTime(essay.article)
const nugget = extractText(essay.nugget)
  const nuggetAuthor = extractText(essay.nuggetAuthor)

  return (
    <div className="article-page">
      <ArticleNav title={title} />

      <main>
        <article>
          {/* ── Header ─────────────────────────────────── */}
          <header className="article-header">
            <div className="article-header__inner">
              {/* Label row: category + date */}
              <div className="article-header__label-row">
                {category && <span className="article-header__category">{category}</span>}
                {category && date && <span className="article-header__label-sep" aria-hidden="true" />}
                {date && <span className="article-header__date">{formatDate(date)}</span>}
              </div>

              {/* Headline */}
              <h1 className="article-header__title">{title}</h1>

              {/* Byline */}
              <p className="article-header__byline">
                By {author}
                <span className="article-header__byline-sep">·</span>
                {mins} min read
                {essay.tags && essay.tags.length > 0 && (
                  <>
                    <span className="article-header__byline-sep">·</span>
                    <span className="article-header__tag-inline">{essay.tags[0]}</span>
                  </>
                )}
              </p>

              {/* Share */}
              <ShareBar title={title} />
            </div>
          </header>

          {/* Hero image removed — let writing lead */}

          {/* ── Body ───────────────────────────────────── */}
          <div className="article-body-wrap">
            <div className="article-body">
              <RichTextRenderer content={essay.article as Document} />
            </div>

            {/* Wisdom Nugget */}
            {nugget && (
              <aside className="nugget">
                <p className="nugget__label">NUGGET OF WISDOM</p>
                <p className="nugget__quote">{nugget}</p>
                {nuggetAuthor && <cite className="nugget__cite">— {nuggetAuthor}</cite>}
              </aside>
            )}

            {/* Article Footer */}
            <footer className="article-footer">
              <Link to="/essays">← All Writing</Link>
              <Link to="/">Home →</Link>
            </footer>
          </div>
        </article>
      </main>

      {/* Site Footer */}
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

// ─── Sticky Nav ───────────────────────────────────────────────────────────────

function ArticleNav({ title }: { title: string }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 280)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="article-nav">
      <div className="article-nav__inner">
        <Link to="/essays" className="article-nav__back">← Writing</Link>
        {scrolled && title ? (
          <span className="article-nav__scrolled-title">{title}</span>
        ) : (
          <Link to="/" className="article-nav__home">Markian.</Link>
        )}
      </div>
    </nav>
  )
}
