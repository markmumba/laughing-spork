import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Wordmark from './Wordmark'
import { getEssaysForHomepage, type EssayItem } from '../lib/contentful'
import { experience, projects, technologies, technologyGroups } from '../lib/site-data'
import './Nav.css'

type Page = 'home' | 'essays' | 'resume'
type SectionId = 'writing' | 'about' | 'skills' | 'projects' | 'github-activity' | 'contact'

const sections: { id: SectionId; label: string; blurb: string }[] = [
  { id: 'projects', label: 'Work', blurb: "Products I've designed, built and shipped." },
  { id: 'writing', label: 'Writing', blurb: "Where I share what I'm learning and thinking about." },
  { id: 'skills', label: 'Skills', blurb: 'The languages, frameworks and infrastructure I reach for most.' },
  { id: 'about', label: 'About', blurb: 'Software engineer specializing in backend.' },
  { id: 'github-activity', label: 'GitHub activity', blurb: "What I've been building in public lately." },
  { id: 'contact', label: 'Contact', blurb: 'Open to remote work worldwide.' },
]

// Document order on the homepage, used for the scroll position check
const pageOrder: SectionId[] = ['writing', 'about', 'skills', 'projects', 'github-activity', 'contact']

const GITHUB = 'https://github.com/markmumba'
const LINKEDIN = 'https://www.linkedin.com/in/markian-mumba-67231517a/'

function extractText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

// ─── Icons (outlined, 24px grid) ─────────────────────────────────────────────

const iconPaths: Record<string, string> = {
  article: 'M6 3h9l4 4v14H6zM15 3v4h4M9 11h7M9 15h7M9 18h4',
  layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  commit: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 12h6M15 12h6',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  code: 'm8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  doc: 'M6 3h9l4 4v14H6zM15 3v4h4M12 11v6M9 14l3 3 3-3',
}

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  )
}

// ─── Explore menu panel content ──────────────────────────────────────────────

type MenuItem = { key: string; title: string; description: string; href: string; external?: boolean; route?: boolean; media: ReactNode }

function MenuGrid({ items, onNavigate }: { items: MenuItem[]; onNavigate: () => void }) {
  return (
    <ul className="explore__grid">
      {items.map((item) => {
        const body = (
          <>
            <span className="explore__media">{item.media}</span>
            <span className="explore__item-text">
              <span className="explore__item-title">{item.title}</span>
              <span className="explore__item-desc">{item.description}</span>
            </span>
          </>
        )
        return (
          <li key={item.key}>
            {item.route ? (
              <RouterLink to={item.href} className="explore__item" onClick={onNavigate}>{body}</RouterLink>
            ) : (
              <a
                href={item.href}
                className="explore__item"
                onClick={onNavigate}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {body}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function panelItems(id: SectionId, essays: EssayItem[] | null, sectionHref: (id: SectionId) => string): MenuItem[] {
  switch (id) {
    case 'projects':
      return projects.map((project) => ({
        key: project.name,
        title: project.name,
        description: project.description,
        href: project.demo,
        external: true,
        media: <img src={project.image} alt="" loading="lazy" decoding="async" />,
      }))
    case 'writing':
      return (essays ?? []).slice(0, 3).map((essay) => ({
        key: essay.id,
        title: extractText(essay.title),
        description: extractText(essay.category) || 'Essay',
        href: `/essays/${essay.id}`,
        route: true,
        media: <Icon name="article" />,
      }))
    case 'skills':
      return technologyGroups.map((group) => ({
        key: group.id,
        title: group.label,
        description: technologies.filter((tech) => tech.group === group.id).map((tech) => tech.name).join(', '),
        href: sectionHref('skills'),
        media: <Icon name={group.id === 'infrastructure' ? 'layers' : 'code'} />,
      }))
    case 'about':
      return experience.map((job) => ({
        key: job.role,
        title: job.role,
        description: `${job.company} • ${job.year}`,
        href: sectionHref('about'),
        media: <Icon name="person" />,
      }))
    case 'github-activity':
      return [
        { key: 'year', title: 'A year in commits', description: 'Public default-branch commits, day by day.', href: sectionHref('github-activity'), media: <Icon name="commit" /> },
        { key: 'languages', title: 'Languages in motion', description: "What I've touched across recent public commits.", href: sectionHref('github-activity'), media: <Icon name="chart" /> },
        { key: 'profile', title: 'GitHub profile', description: 'Repositories, source code and contributions.', href: GITHUB, external: true, media: <Icon name="code" /> },
      ]
    case 'contact':
      return [
        { key: 'email', title: 'Email', description: 'mumbamarkian@gmail.com', href: 'mailto:mumbamarkian@gmail.com', media: <Icon name="mail" /> },
        { key: 'linkedin', title: 'LinkedIn', description: 'Experience, recommendations and updates.', href: LINKEDIN, external: true, media: <Icon name="link" /> },
        { key: 'cv', title: 'Download CV', description: 'A one-page PDF of my experience.', href: '/cv.pdf', external: true, media: <Icon name="doc" /> },
      ]
  }
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

export default function Nav({ page = 'home' }: { page?: Page }) {
  const isHome = page === 'home'
  const sectionHref = (id: SectionId) => (isHome ? `#${id}` : `/#${id}`)

  const [scrolled, setScrolled] = useState(false)
  const [current, setCurrent] = useState<SectionId | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<SectionId>('projects')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [essays, setEssays] = useState<EssayItem[] | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // Scroll state, plus (on the homepage) the section whose top has passed the upper third of the viewport
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > 8)
      if (!isHome) return
      const line = window.innerHeight * 0.33
      let found: SectionId | null = null
      for (const id of pageOrder) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) found = id
      }
      // The last section is too short to reach the line, so it wins once the page bottoms out
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) found = pageOrder[pageOrder.length - 1]
      setCurrent(found)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [isHome])

  // Latest essays for the Writing panel, fetched the first time the menu opens
  useEffect(() => {
    if (!menuOpen || essays) return
    let cancelled = false
    getEssaysForHomepage().then((items) => { if (!cancelled) setEssays(items) })
    return () => { cancelled = true }
  }, [menuOpen, essays])

  // Escape and outside clicks close the menu
  useEffect(() => {
    if (!menuOpen && !sheetOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      setSheetOpen(false)
      triggerRef.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
        setSheetOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen, sheetOpen])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const openMenu = () => {
    window.clearTimeout(closeTimer.current)
    if (!menuOpen) setPanel(current ?? 'projects')
    setMenuOpen(true)
  }

  // Hover intent: a short grace period so moving from the trigger to the panel doesn't close it
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setMenuOpen(false), 180)
  }

  const closeAll = () => {
    window.clearTimeout(closeTimer.current)
    setMenuOpen(false)
    setSheetOpen(false)
  }

  const active = sections.find((section) => section.id === panel) ?? sections[0]
  const items = panelItems(panel, essays, sectionHref)

  return (
    <header
      ref={headerRef}
      className={`nav${scrolled || menuOpen ? ' nav--raised' : ''}`}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') scheduleClose() }}
      onPointerEnter={() => window.clearTimeout(closeTimer.current)}
    >
      <div className="nav__bar">
        {isHome ? (
          <a href="#hero" className="nav__logo" aria-label="Markian Mumba Mwangi, back to top" onClick={closeAll}>
            <Wordmark />
          </a>
        ) : (
          <RouterLink to="/" className="nav__logo" aria-label="Markian Mumba Mwangi, home">
            <Wordmark />
          </RouterLink>
        )}

        <nav className="nav__primary" aria-label="Main">
          <button
            ref={triggerRef}
            type="button"
            className={`nav__link nav__link--menu${menuOpen ? ' is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="explore-menu"
            onClick={() => (menuOpen ? closeAll() : openMenu())}
            onPointerEnter={(event) => { if (event.pointerType === 'mouse') openMenu() }}
          >
            Explore
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z" /></svg>
          </button>
          <RouterLink to="/essays" className={`nav__link${page === 'essays' ? ' is-current' : ''}`} aria-current={page === 'essays' ? 'page' : undefined} onPointerEnter={scheduleClose}>Writing</RouterLink>
          <RouterLink to="/resume" className={`nav__link${page === 'resume' ? ' is-current' : ''}`} aria-current={page === 'resume' ? 'page' : undefined} onPointerEnter={scheduleClose}>Resume</RouterLink>
          <a href={sectionHref('contact')} className="nav__link nav__link--accent" onPointerEnter={scheduleClose}>Contact</a>
        </nav>

        <div className="nav__actions">
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="nav__icon-link" aria-label="GitHub">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          {page === 'resume' && (
            <a href="/cv.pdf" target="_blank" rel="noopener noreferrer" className="btn btn--outlined btn--sm nav__cta">Download CV</a>
          )}
          <a href={sectionHref('contact')} className="btn btn--filled btn--sm nav__cta" onClick={closeAll}>Work with me</a>
          <button
            type="button"
            className="nav__burger"
            onClick={() => { setMenuOpen(false); setSheetOpen((open) => !open) }}
            aria-label="Toggle menu"
            aria-expanded={sheetOpen}
            aria-controls="nav-sheet"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Desktop: Explore mega menu — section rail on the left, preview of the hovered section on the right */}
      {menuOpen && (
        <div className="explore" id="explore-menu">
          <div className="explore__rail">
            <ul>
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={sectionHref(section.id)}
                    className={`explore__rail-link${panel === section.id ? ' is-active' : ''}`}
                    aria-current={current === section.id ? 'location' : undefined}
                    onPointerEnter={() => setPanel(section.id)}
                    onFocus={() => setPanel(section.id)}
                    onClick={closeAll}
                  >
                    {section.label}
                    {current === section.id && <span className="explore__here">You're here</span>}
                  </a>
                </li>
              ))}
            </ul>
            <RouterLink to="/resume" className="btn btn--outlined explore__rail-cta" onClick={closeAll}>View full resume</RouterLink>
          </div>

          <div className="explore__panel">
            <a href={sectionHref(active.id)} className="explore__heading" onClick={closeAll}>
              {active.label}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
            </a>
            <p className="explore__blurb">{active.blurb}</p>
            {panel === 'writing' && !essays ? (
              <p className="explore__loading" role="status">Loading the latest essays…</p>
            ) : (
              <MenuGrid items={items} onNavigate={closeAll} />
            )}
            {panel === 'writing' && (
              <div className="explore__footer">
                <span>Looking for something older?</span>
                <RouterLink to="/essays" onClick={closeAll}>See all essays</RouterLink>
              </div>
            )}
          </div>

          <button type="button" className="explore__close" onClick={() => { closeAll(); triggerRef.current?.focus() }} aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
      )}

      {/* Mobile: full-width sheet */}
      {sheetOpen && (
        <nav className="nav__sheet" id="nav-sheet" aria-label="Menu">
          <p className="nav__sheet-label">Explore</p>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={sectionHref(section.id)} onClick={closeAll} className={current === section.id ? 'is-active' : undefined}>
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
          <ul className="nav__sheet-pages">
            <li><RouterLink to="/essays" onClick={closeAll}>All essays</RouterLink></li>
            <li><RouterLink to="/resume" onClick={closeAll}>Resume</RouterLink></li>
          </ul>
          <a href={sectionHref('contact')} className="btn btn--filled nav__sheet-cta" onClick={closeAll}>Work with me</a>
        </nav>
      )}
    </header>
  )
}
