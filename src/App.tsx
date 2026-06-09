import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom'
import EssaysPage from './pages/EssaysPage'
import ArticlePage from './pages/ArticlePage'
import './App.css'

// ─── Data ────────────────────────────────────────────────────────────────────

const projects = [
  {
    id: 1,
    name: 'FolioCuts',
    category: 'PLATFORM',
    description:
      'Digital barbershop management for Kenyan shops. Commission tracking, M-Pesa STK push, automated receipts, loyalty rewards, live analytics, staff dashboards. 3-minute onboarding.',
    tags: ['Spring Boot', 'Next.js', 'M-Pesa', 'PostgreSQL'],
    github: 'https://github.com/markmumba/foliocuts',
    demo: 'https://folio.blazor-movies.online/',
  },
  {
    id: 2,
    name: 'Garbage Collection System',
    category: 'FULLSTACK',
    description:
      'Waste management platform connecting households with local collectors. Real-time pickup tracking, automated payments and payouts.',
    tags: ['Next.js', 'Spring Boot', 'PostgreSQL'],
    github: 'https://github.com/markmumba/bolloapp-frontend',
    demo: 'https://bolla.blazor-movies.online/',
  },
  {
    id: 3,
    name: 'Rentitup',
    category: 'MARKETPLACE',
    description:
      'Rental platform connecting machinery owners with users — from contractors to homeowners.',
    tags: ['Next.js', 'Spring Boot'],
    github: 'https://github.com/markmumba/rentitup-frontend',
    demo: 'https://rentitup.blazor-movies.online/',
  },
  {
    id: 4,
    name: 'ESTC Website',
    category: 'CORPORATE',
    description:
      'Website for a professional training organization offering Leadership, ICT, and HR programs.',
    tags: ['Next.js', 'CMS'],
    github: 'https://github.com/markmumba/estc',
    demo: 'https://exceptionalskills.co.ke/',
  },
  {
    id: 5,
    name: 'Bag Street Kenya',
    category: 'E-COMMERCE',
    description:
      'E-commerce platform for bags, shoes, and scarves with WhatsApp integration.',
    tags: ['Next.js', 'WhatsApp API'],
    github: 'https://github.com/markmumba/bag_street_kenya',
    demo: 'https://bagstreetke.co.ke/',
  },
]

const articles = [
  {
    id: 1,
    title: 'The Config Server Needs the Service Registry…',
    subtitle: 'Part 9: Centralized Configuration, Distributed Tracing',
    date: '5 days ago',
  },
  {
    id: 2,
    title: 'A User Clicks "Book Now"…',
    subtitle: 'Part 8: Common Module, Auto-Configuration, gRPC Auth',
    date: '6 days ago',
  },
  {
    id: 3,
    title: 'Everything I Knew About Spring Security…',
    subtitle: 'Part 6: Authentication in Microservices',
    date: '7 days ago',
  },
  {
    id: 4,
    title: 'Half of My OAuth2 Login Flow…',
    subtitle: 'Part 7: Authorization Server, Spring mechanisms',
    date: '7 days ago',
  },
]

const skills: Record<string, string[]> = {
  'Languages & Frameworks': [
    'Java',
    'Spring Boot',
    'Next.js',
    'TypeScript',
    'Python',
    'React',
    'Tailwind CSS',
  ],
  'Infrastructure & Tools': [
    'Docker',
    'PostgreSQL',
    'MongoDB',
    'VPS',
    'Linux',
    'Git',
    'Nginx',
    'CI/CD',
  ],
  'Architecture & Design': [
    'Microservices',
    'REST APIs',
    'Domain-Driven Design',
    'Event-Driven Architecture',
  ],
}

// ─── Hook: Scroll Reveal ─────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          observer.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setMenuOpen(false)

  return (
    <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`} role="navigation">
      <div className="nav__inner">
        <a href="#hero" className="nav__logo">
          Markian.
        </a>
        <ul className={`nav__links${menuOpen ? ' nav__links--open' : ''}`}>
          <li>
            <a href="#about" onClick={close}>
              About
            </a>
          </li>
          <li>
            <a href="#projects" onClick={close}>
              Projects
            </a>
          </li>
          <li>
            <RouterLink to="/essays" onClick={close}>
              Writing
            </RouterLink>
          </li>
          <li>
            <a href="#contact" onClick={close}>
              Contact
            </a>
          </li>
          <li>
            <a
              href="https://github.com/markmumba"
              target="_blank"
              rel="noopener noreferrer"
              className="nav__github"
              aria-label="GitHub"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </li>
        </ul>
        <button
          className="nav__burger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span className={menuOpen ? 'hidden' : ''} />
        </button>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__inner">
        <p className="hero__eyebrow">NAIROBI, KENYA — AVAILABLE WORLDWIDE</p>
        <h1 className="hero__name">
          <span className="hero__line">ENGINEER.</span>
          <span className="hero__line">LEARNER.</span>
          <span className="hero__line">PHILOSOPHER.</span>
        </h1>
        <div className="hero__meta">
          <p className="hero__subtitle">Markian Mumba — Fullstack Developer</p>
          <p className="hero__desc">
            Building distributed systems and clean abstractions.
            <br />
            Java, Spring Boot, Next.js, TypeScript.
          </p>
        </div>
        <div className="hero__ctas">
          <a href="#projects" className="hero__cta hero__cta--primary">
            View Work ›
          </a>
          <a href="#contact" className="hero__cta hero__cta--ghost">
            Get in Touch ›
          </a>
        </div>
      </div>
      <div className="hero__scroll" aria-hidden="true">
        ↓
      </div>
    </section>
  )
}

// ─── About ───────────────────────────────────────────────────────────────────

function About() {
  const ref = useReveal()
  return (
    <section id="about" className="section section--white">
      <div className="container">
        <div ref={ref} className="reveal about__grid">
          <div className="about__left">
            <p className="section__eyebrow">ABOUT</p>
            <h2 className="section__headline">
              Fascinated by how
              <br />
              systems think.
            </h2>
            <p className="about__body">
              It started with a Samsung Note 5. Studying Computer Science — compiler
              construction, distributed systems, concurrency — only deepened the obsession.
              Today I build production systems at Cloudit and contribute to payment
              microservices at Kyosk.
            </p>
            <p className="about__body">
              I believe code is a craft. The goal isn't just working software — it's
              software that communicates clearly to the next person who reads it.
            </p>
            <blockquote className="about__quote">
              <p>
                "The purpose of music is not the end of the composition — the whole point
                of the dancing is the dance."
              </p>
              <cite>— Alan Watts</cite>
            </blockquote>
          </div>
          <div className="about__right">
            <div className="about__card">
              <p className="about__card-label">CURRENT FOCUS</p>
              <ul className="about__focus-list">
                <li>Exploring distributed systems</li>
                <li>
                  Reading <em>Designing Data-Intensive Applications</em>
                </li>
                <li>The psychology of debugging</li>
                <li>Learning Rust + advanced concurrency</li>
              </ul>
            </div>
            <div className="about__card">
              <p className="about__card-label">EXPERIENCE</p>
              <ul className="about__exp-list">
                <li>
                  <span className="exp__role">Fullstack Developer</span>
                  <span className="exp__company">Cloudit · 2025</span>
                </li>
                <li>
                  <span className="exp__role">Backend Engineer</span>
                  <span className="exp__company">Kyosk · 2025</span>
                </li>
                <li>
                  <span className="exp__role">Freelance Developer</span>
                  <span className="exp__company">Independent · 2023</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Skills ──────────────────────────────────────────────────────────────────

function Skills() {
  const ref = useReveal()
  return (
    <section id="skills" className="section section--gray">
      <div className="container">
        <div ref={ref} className="reveal">
          <p className="section__eyebrow">SKILLS</p>
          <h2 className="section__headline">Tools of the trade.</h2>
          <div className="skills__grid">
            {Object.entries(skills).map(([category, items]) => (
              <div key={category} className="skills__group">
                <p className="skills__category">{category}</p>
                <div className="skills__tags">
                  {items.map((skill) => (
                    <span key={skill} className="skill__tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Projects ────────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: (typeof projects)[0] }) {
  return (
    <div className="project-card">
      <p className="project-card__category">{project.category}</p>
      <h3 className="project-card__name">{project.name}</h3>
      <p className="project-card__desc">{project.description}</p>
      <div className="project-card__tags">
        {project.tags.map((tag) => (
          <span key={tag} className="project-card__tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="project-card__links">
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="project-card__link"
        >
          GitHub ›
        </a>
        <a
          href={project.demo}
          target="_blank"
          rel="noopener noreferrer"
          className="project-card__link"
        >
          Demo ›
        </a>
      </div>
    </div>
  )
}

function Projects() {
  const ref = useReveal()
  return (
    <section id="projects" className="section section--white">
      <div className="container">
        <div ref={ref} className="reveal">
          <p className="section__eyebrow">PROJECTS</p>
          <h2 className="section__headline">Things I've built.</h2>
          <div className="projects__grid">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Writing ─────────────────────────────────────────────────────────────────

function Writing() {
  const ref = useReveal()
  return (
    <section id="writing" className="section section--gray">
      <div className="container">
        <div ref={ref} className="reveal">
          <p className="section__eyebrow">WRITING</p>
          <h2 className="section__headline">Thoughts &amp; ideas.</h2>
          <p className="section__sub">Where I share what I'm learning and thinking about.</p>
          <div className="writing__list">
            {articles.map((a) => (
              <RouterLink
                key={a.id}
                to="/essays"
                className="article__item"
              >
                <span className="article__date">{a.date}</span>
                <div className="article__content">
                  <h3 className="article__title">{a.title}</h3>
                  <p className="article__subtitle">{a.subtitle}</p>
                </div>
                <span className="article__arrow" aria-hidden="true">
                  ›
                </span>
              </RouterLink>
            ))}
          </div>
          <RouterLink to="/essays" className="cta-link">
            All articles ›
          </RouterLink>
        </div>
      </div>
    </section>
  )
}

// ─── Contact ─────────────────────────────────────────────────────────────────

function Contact() {
  const ref = useReveal()
  return (
    <section id="contact" className="section section--dark">
      <div className="container">
        <div ref={ref} className="reveal contact__inner">
          <p className="section__eyebrow section__eyebrow--light">CONTACT</p>
          <h2 className="contact__headline">
            Let's build
            <br />
            something.
          </h2>
          <p className="contact__body">
            Open to remote work worldwide. Distributed systems, backend architecture,
            fullstack development.
          </p>
          <a href="mailto:mumbamarkian@gmail.com" className="contact__email">
            mumbamarkian@gmail.com
          </a>
          <div className="contact__links">
            <a
              href="https://github.com/markmumba"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.linkedin.com/in/markian-mumba-67231517a/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <span aria-hidden="true">·</span>
            <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
              Resume
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <p className="footer__copy">© 2026 Markian Mumba. All rights reserved.</p>
          <div className="footer__links">
            <a href="https://github.com/markmumba" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/markian-mumba-67231517a/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a href="mailto:mumbamarkian@gmail.com">Email</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Writing />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/essays" element={<EssaysPage />} />
        <Route path="/essays/:id" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
