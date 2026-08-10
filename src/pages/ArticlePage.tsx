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

// ─── Instagram Stories Card Generator ────────────────────────────────────────

async function generateStoriesCard(opts: {
  title: string
  author: string
  category: string
  blogImage: string
  url: string
}): Promise<void> {
  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Load article image
  if (opts.blogImage) {
    await new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // Cover-fit the image
        const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight)
        const dw = img.naturalWidth * scale
        const dh = img.naturalHeight * scale
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
        resolve()
      }
      img.onerror = () => {
        ctx.fillStyle = '#1a1a1e'
        ctx.fillRect(0, 0, W, H)
        resolve()
      }
      img.src = opts.blogImage
    })
  } else {
    ctx.fillStyle = '#1a1a1e'
    ctx.fillRect(0, 0, W, H)
  }

  // Gradient overlay — heavy at bottom for text
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, 'rgba(0,0,0,0.2)')
  grad.addColorStop(0.45, 'rgba(0,0,0,0.3)')
  grad.addColorStop(1, 'rgba(0,0,0,0.88)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  const PAD = 100  // left margin
  const BOTTOM = H - 100  // baseline for branding

  // ── Branding ────────────────────────────────────
  ctx.font = '500 30px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.textBaseline = 'bottom'
  ctx.fillText('markian.fit', PAD, BOTTOM)

  // ── Author ───────────────────────────────────────
  ctx.font = '400 34px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  const authorTop = BOTTOM - 50 - 44
  ctx.fillText(opts.author, PAD, authorTop + 34)

  // ── Divider ──────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillRect(PAD, authorTop - 20, 60, 2)

  // ── Title ────────────────────────────────────────
  const titleSize = opts.title.length > 60 ? 58 : opts.title.length > 40 ? 66 : 76
  ctx.font = `800 ${titleSize}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'

  const maxW = W - PAD - 100
  const words = opts.title.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)

  const lineH = titleSize * 1.18
  const titleBlockH = lines.length * lineH
  const titleTop = authorTop - 20 - 32 - titleBlockH  // 32px gap above divider

  let ty = titleTop
  for (const l of lines) {
    ctx.fillText(l, PAD, ty)
    ty += lineH
  }

  // ── Category pill (above title) ──────────────────
  if (opts.category) {
    const pillText = opts.category.toUpperCase()
    ctx.font = '600 28px -apple-system, BlinkMacSystemFont, sans-serif'
    const tw = ctx.measureText(pillText).width
    const pillPX = 36
    const pillH = 56
    const pillX = PAD
    const pillY = titleTop - pillH - 24  // 24px gap above title

    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.roundRect(pillX, pillY, tw + pillPX * 2, pillH, 14)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.textBaseline = 'middle'
    ctx.fillText(pillText, pillX + pillPX, pillY + pillH / 2)
  }

  // Download
  const a = document.createElement('a')
  a.download = `story-${opts.title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
}

// ─── Share Bar ────────────────────────────────────────────────────────────────

interface ShareBarProps {
  title: string
  author: string
  category: string
  blogImage: string
}

function ShareBar({ title, author, category, blogImage }: ShareBarProps) {
  const [copied, setCopied] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleStory = async () => {
    setGeneratingStory(true)
    try {
      await generateStoriesCard({ title, author, category, blogImage, url: window.location.href })
    } finally {
      setGeneratingStory(false)
    }
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
        {/* Instagram Story */}
        <button
          onClick={handleStory}
          disabled={generatingStory}
          className={`share-btn share-btn--story${generatingStory ? ' share-btn--generating' : ''}`}
          aria-label="Download Instagram Story card"
        >
          {generatingStory ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="share-btn__spinner">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          )}
          <span className="share-btn__label">{generatingStory ? 'Generating…' : 'Story'}</span>
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
              <ShareBar title={title} author={author} category={category} blogImage={essay.blogImage} />
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
