import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEssayById, getEssaysForHomepage, type EssayItem } from '../lib/contentful'
import { contentfulSrcSet, optimizeContentfulImageUrl } from '../lib/contentful-image'
import RichTextRenderer from '../lib/richtext'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
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

// Same formula as the essays index, so card and article agree on reading time
function readTime(article: unknown): number {
  const text = richTextToPlain(article) || extractText(article)
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 230))
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

// ─── Share rail ───────────────────────────────────────────────────────────────

interface ShareProps {
  title: string
  author: string
  category: string
  blogImage: string
}

// Vertical icon rail on desktop (right edge, like the Cloud blog); a row under the header on phones
function ShareRail({ title, author, category, blogImage }: ShareProps) {
  const [copied, setCopied] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)
  const url = window.location.href

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleStory = async () => {
    setGeneratingStory(true)
    try {
      await generateStoriesCard({ title, author, category, blogImage, url })
    } finally {
      setGeneratingStory(false)
    }
  }

  const links = [
    {
      label: 'Share on X',
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.734l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.34 17.34V10H5.9v7.34zM7.12 8.98a1.42 1.42 0 1 0 0-2.84 1.42 1.42 0 0 0 0 2.84m11.22 8.36v-4.02c0-2.15-1.15-3.15-2.68-3.15a2.32 2.32 0 0 0-2.1 1.16V10h-2.44c.03.69 0 7.34 0 7.34h2.44v-4.1c0-.22.02-.44.08-.6.18-.44.58-.9 1.26-.9.89 0 1.25.68 1.25 1.67v3.93z" />,
    },
    {
      label: 'Share via email',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
      icon: <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 4-8 5-8-5V6l8 5 8-5z" />,
    },
  ]

  return (
    <div className="share-rail" role="group" aria-label="Share this article">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="share-rail__btn"
          aria-label={link.label}
          title={link.label}
          {...(link.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{link.icon}</svg>
        </a>
      ))}
      <button type="button" onClick={handleCopy} className="share-rail__btn" aria-label={copied ? 'Link copied' : 'Copy link'} title={copied ? 'Copied' : 'Copy link'}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {copied
            ? <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            : <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12M8 13h8v-2H8zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10" />}
        </svg>
      </button>
      <button
        type="button"
        onClick={handleStory}
        disabled={generatingStory}
        className="share-rail__btn"
        aria-label={generatingStory ? 'Generating Instagram Story card' : 'Download Instagram Story card'}
        title="Instagram Story card"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={generatingStory ? 'share-rail__spin' : undefined}>
          {generatingStory
            ? <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            : <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>}
        </svg>
      </button>
    </div>
  )
}

// ─── Related essays ───────────────────────────────────────────────────────────

function RelatedEssays({ currentId }: { currentId: string }) {
  const [essays, setEssays] = useState<EssayItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    getEssaysForHomepage().then((items) => {
      if (!cancelled) setEssays(items.filter((e) => e.id !== currentId).slice(0, 3))
    })
    return () => { cancelled = true }
  }, [currentId])

  if (!essays?.length) return null

  return (
    <section className="article-related" aria-labelledby="related-title">
      <div className="article-related__inner">
        <div className="section-head section-head--row">
          <h2 id="related-title" className="section-head__title">More from Writing</h2>
          <Link to="/essays" className="btn btn--text">All essays</Link>
        </div>
        <div className="article-related__grid">
          {essays.map((e) => {
            const img = e.blogImage
            return (
              <Link key={e.id} to={`/essays/${e.id}`} className="post-card">
                <div className="post-card__img">
                  {img && (
                    <img
                      src={optimizeContentfulImageUrl(img, { width: 600, quality: 60 })}
                      srcSet={contentfulSrcSet(img, [400, 600, 800], 60)}
                      sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 410px"
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <span className="chip">{extractText(e.category) || 'Essay'}</span>
                <h3 className="post-card__title">{extractText(e.title)}</h3>
                <p className="post-card__meta">{formatDate(extractText(e.publishDate as string))} • {readTime(e.article)}-minute read</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [result, setResult] = useState<{ id: string; essay: EssayItem | null } | null>(null)
  const essay = result?.id === id ? result?.essay ?? null : null
  const loading = Boolean(id) && result?.id !== id

  const metaTitle = essay ? extractText(essay.title) : 'Article'
  const metaDesc = essay ? richTextToPlain(essay.article).slice(0, 160).trimEnd() : undefined
  usePageMeta({ title: metaTitle, description: metaDesc, image: essay?.blogImage || undefined })

  useEffect(() => {
    if (!id) return
    window.scrollTo(0, 0)
    let cancelled = false
    getEssayById(id).then((data) => {
      if (!cancelled) setResult({ id, essay: data })
    })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="article-page">
        <Nav page="essays" />
        <div className="article-loading" role="status" aria-label="Loading article" />
      </div>
    )
  }

  if (!essay) {
    return (
      <div className="article-page">
        <Nav page="essays" />
        <div className="article-missing">
          <h1>Article not found</h1>
          <p>It may have been moved, or it doesn't exist.</p>
          <Link to="/essays" className="btn btn--filled">Browse all essays</Link>
        </div>
        <Footer />
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
      <Nav page="essays" />

      <main>
        <article>
          {/* Centered header, as on the Cloud blog: tag, title, date, author */}
          <header className="article-header">
            {category && <span className="chip">{category}</span>}
            <h1 className="article-header__title">{title}</h1>
            {date && <p className="article-header__date">{formatDate(date)}</p>}
            <div className="article-header__author">
              <span className="article-header__author-name">{author}</span>
              <span className="article-header__author-role">Software Engineer • {mins}-minute read</span>
            </div>
            {essay.tags && essay.tags.length > 0 && (
              <ul className="article-header__tags" aria-label="Topics">
                {essay.tags.slice(0, 4).map((tag) => <li key={tag} className="chip">{tag}</li>)}
              </ul>
            )}
          </header>

          <div className="article-layout">
            {/* Left: sticky promo card, like the blog's "Try Gemini today" */}
            <aside className="article-aside" aria-label="About the author">
              <div className="article-aside__card">
                <p className="article-aside__title">Work with me</p>
                <p className="article-aside__text">Backend and fullstack engineer in Nairobi, open to remote roles.</p>
                <a href="/#contact" className="btn btn--filled">Get in touch</a>
              </div>
            </aside>

            <div className="article-content">
              <div className="article-body">
                <RichTextRenderer content={essay.article as Document} />
              </div>

              {nugget && (
                <aside className="nugget">
                  <p className="nugget__label">Nugget of wisdom</p>
                  <p className="nugget__quote">{nugget}</p>
                  {nuggetAuthor && <cite className="nugget__cite">{nuggetAuthor}</cite>}
                </aside>
              )}

              <div className="article-end">
                <span>Thanks for reading.</span>
                <Link to="/essays" className="btn btn--outlined">All essays</Link>
              </div>
            </div>

            <div className="article-share">
              <ShareRail title={title} author={author} category={category} blogImage={essay.blogImage} />
            </div>
          </div>
        </article>

        {id && <RelatedEssays currentId={id} />}
      </main>

      <Footer />
    </div>
  )
}
