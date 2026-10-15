import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEssaysForHomepage, type EssayItem } from '../lib/contentful'
import { contentfulSrcSet, optimizeContentfulImageUrl } from '../lib/contentful-image'
import type { GitHubStats } from '../lib/github-stats.types'
import './Hero.css'

type StoryCard = {
  key: string
  eyebrow: string
  title: string
  href: string
  internal?: boolean
  external?: boolean
  image?: string
  srcSet?: string
  tone: 'ocean' | 'ember' | 'violet' | 'night'
}

function monthYear(value: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

function buildCards(essay: EssayItem | null, stats: GitHubStats | null): StoryCard[] {
  const essayTitle = essay && typeof essay.title === 'string' ? essay.title : ''
  return [
    essay && essayTitle
      ? {
          key: 'essay',
          eyebrow: 'Latest essay',
          title: essayTitle,
          href: `/essays/${essay.id}`,
          internal: true,
          image: essay.blogImage ? optimizeContentfulImageUrl(essay.blogImage, { width: 800, quality: 70 }) : undefined,
          srcSet: essay.blogImage ? contentfulSrcSet(essay.blogImage, [400, 600, 800, 1000], 60) : undefined,
          tone: 'night',
        }
      : {
          key: 'essay',
          eyebrow: 'Ideas & writing',
          title: 'Essays on engineering, craft and the ideas behind them',
          href: '/essays',
          internal: true,
          tone: 'night',
        },
    {
      key: 'foliocuts',
      eyebrow: 'Featured project',
      title: 'FolioCuts: payments, commissions and analytics for barbershops',
      href: '#projects',
      image: '/projects/foliocuts.webp',
      tone: 'ocean',
    },
    {
      key: 'github',
      eyebrow: 'On GitHub',
      title: stats
        ? `${stats.totalCommits.toLocaleString()} public commits since ${monthYear(stats.range.start)}`
        : 'Building in public, one commit at a time',
      href: '#github-activity',
      tone: 'violet',
    },
    {
      key: 'rentitup',
      eyebrow: 'Marketplace',
      title: 'Rentitup: machinery rentals for contractors and homeowners',
      href: 'https://rentitup.markian.fit',
      external: true,
      image: '/projects/rentitup.webp',
      tone: 'ember',
    },
    {
      key: 'resume',
      eyebrow: 'Experience',
      title: 'Where I have worked and the stack I reach for',
      href: '/resume',
      internal: true,
      tone: 'ocean',
    },
  ]
}

function StoryCardLink({ card, priority = false }: { card: StoryCard; priority?: boolean }) {
  const body = (
    <>
      {card.image && (
        <img
          className="hero-card__image"
          src={card.image}
          srcSet={card.srcSet}
          sizes="(max-width: 734px) 84vw, min(40vw, 594px)"
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
      )}
      <span className="hero-card__scrim" aria-hidden="true" />
      <span className="hero-card__text">
        <span className="hero-card__eyebrow">{card.eyebrow}</span>
        <span className="hero-card__title">{card.title}</span>
      </span>
    </>
  )
  const className = `hero-card hero-card--${card.tone}${card.image ? ' hero-card--image' : ''}`

  if (card.internal) return <Link to={card.href} className={className}>{body}</Link>
  return (
    <a
      href={card.href}
      className={className}
      {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {body}
    </a>
  )
}

const AUTOPLAY_MS = 6000

export default function Hero() {
  const [essay, setEssay] = useState<EssayItem | null>(null)
  const [stats, setStats] = useState<GitHubStats | null>(null)
  // Start on the second card so cards peek in from both edges, as on cloud.google.com
  const [index, setIndex] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollFrame = useRef(0)

  useEffect(() => {
    let cancelled = false
    getEssaysForHomepage().then((items) => {
      if (!cancelled) setEssay(items[0] ?? null)
    })
    const controller = new AbortController()
    fetch('/api/github-stats', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GitHubStats | null) => { if (data) setStats(data) })
      .catch(() => {})
    return () => { cancelled = true; controller.abort() }
  }, [])

  const cards = buildCards(essay, stats)

  const centerCard = (target: number, behavior: ScrollBehavior = 'smooth') => {
    const track = trackRef.current
    const card = track?.children[target] as HTMLElement | undefined
    if (!track || !card) return
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior })
  }

  // Latest index for the resize handler, which is registered once
  const indexRef = useRef(index)
  useEffect(() => { indexRef.current = index }, [index])

  // Position the track before the first paint. Otherwise the first frame shows card 0 (the
  // latest essay, whose image waits on the Contentful API) centered and it becomes the LCP;
  // landing on card 1 first makes the local FolioCuts screenshot the LCP instead.
  useLayoutEffect(() => {
    centerCard(indexRef.current, 'instant')
    const onResize = () => centerCard(indexRef.current, 'instant')
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Gentle autoplay: pauses on hover/focus, when off screen, and for reduced-motion users
  useEffect(() => {
    if (!playing || hovered) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      const track = trackRef.current
      if (!track || document.hidden) return
      const rect = track.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) return
      setIndex((i) => {
        const next = (i + 1) % cards.length
        centerCard(next)
        return next
      })
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [playing, hovered, cards.length])

  // Keep the index in sync when someone swipes or scrolls the track by hand
  const onTrackScroll = () => {
    cancelAnimationFrame(scrollFrame.current)
    scrollFrame.current = requestAnimationFrame(() => {
      const track = trackRef.current
      if (!track) return
      const middle = track.scrollLeft + track.clientWidth / 2
      let nearest = 0
      let best = Infinity
      Array.from(track.children).forEach((child, i) => {
        const el = child as HTMLElement
        const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - middle)
        if (distance < best) { best = distance; nearest = i }
      })
      setIndex(nearest)
    })
  }

  // Manual navigation stops autoplay, so the carousel never fights the visitor
  const go = (target: number) => {
    setPlaying(false)
    const next = (target + cards.length) % cards.length
    setIndex(next)
    centerCard(next)
  }

  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <div className="hero__intro">
        <h1 id="hero-title" className="hero__title">Software that just works</h1>
        <p className="hero__sub">
          I'm <Link to="/resume">Markian</Link>, a fullstack developer in Nairobi building
          reliable systems and thoughtful interfaces.
        </p>
        <div className="hero__actions">
          <a href="#projects" className="btn btn--filled">View work</a>
          <a href="#contact" className="btn btn--outlined">Get in touch</a>
        </div>
      </div>

      <div
        className="hero__stories"
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true) }}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false) }}
      >
        <div
          className="hero__track"
          ref={trackRef}
          onScroll={onTrackScroll}
          onPointerDown={() => setPlaying(false)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Highlights"
        >
          {cards.map((card, i) => <StoryCardLink key={card.key} card={card} priority={i === 1} />)}
        </div>
        <div className="hero__controls">
          <button type="button" className="icon-btn" onClick={() => go(index - 1)} aria-label="Previous highlight">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z" /></svg>
          </button>
          <div className="hero__dots">
            {cards.map((card, i) => (
              <button
                key={card.key}
                type="button"
                className={`hero__dot${i === index ? ' is-active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Show highlight ${i + 1}: ${card.eyebrow}`}
                aria-current={i === index ? 'true' : undefined}
              />
            ))}
          </div>
          <button type="button" className="icon-btn" onClick={() => go(index + 1)} aria-label="Next highlight">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" /></svg>
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--quiet"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause highlights' : 'Play highlights'}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6zm8-14v14h4V5z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
