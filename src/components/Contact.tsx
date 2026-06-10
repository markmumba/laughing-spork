import { useRef, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useReveal } from '../hooks/useReveal'
import './Contact.css'

export default function Contact() {
  const textRef = useReveal()
  const envRef  = useRef<HTMLDivElement>(null)
  const [envOpen, setEnvOpen] = useState(false)

  useEffect(() => {
    const el = envRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setEnvOpen(true), 350); io.disconnect() } },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="contact" className="section section--dark">
      <div className="container">
        <div className="contact__layout">

          {/* ── Text ── */}
          <div ref={textRef} className="reveal contact__text">
            <p className="section__eyebrow section__eyebrow--light">CONTACT</p>
            <h2 className="contact__headline">Let's build<br />something.</h2>
            <p className="contact__body">
              Open to remote work worldwide. Distributed systems,
              backend architecture, fullstack development.
            </p>
            <div className="contact__links">
              <a href="https://github.com/markmumba" target="_blank" rel="noopener noreferrer">GitHub</a>
              <span aria-hidden="true">·</span>
              <a href="https://www.linkedin.com/in/markian-mumba-67231517a/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <span aria-hidden="true">·</span>
              <RouterLink to="/resume">Resume</RouterLink>
            </div>
          </div>

          {/* ── Envelope ── */}
          <div ref={envRef} className={`contact__env${envOpen ? ' contact__env--open' : ''}`}>

            {/* Letter — slides up out of envelope */}
            <a href="mailto:mumbamarkian@gmail.com" className="env-letter" aria-label="Email mumbamarkian@gmail.com">
              <span className="env-letter__rule" aria-hidden="true" />
              <span className="env-letter__eyebrow">Say hello</span>
              <span className="env-letter__email">mumbamarkian@gmail.com</span>
              <span className="env-letter__cta">Open email →</span>
            </a>

            {/* Envelope body + crease lines (back layer) */}
            <svg viewBox="0 0 400 260" fill="none" className="env-svg env-svg--body" aria-hidden="true">
              <rect x="1.5" y="1.5" width="397" height="257" rx="9" fill="white" stroke="#d8d8dc" strokeWidth="1.5" />
              <line x1="1.5"   y1="1.5"   x2="200" y2="158" stroke="#eaeaed" strokeWidth="1" />
              <line x1="398.5" y1="1.5"   x2="200" y2="158" stroke="#eaeaed" strokeWidth="1" />
              <line x1="1.5"   y1="258.5" x2="200" y2="158" stroke="#eaeaed" strokeWidth="1" />
              <line x1="398.5" y1="258.5" x2="200" y2="158" stroke="#eaeaed" strokeWidth="1" />
            </svg>

            {/* Flap (front layer — collapses up when open) */}
            <svg viewBox="0 0 400 260" fill="none" className="env-svg env-svg--flap" aria-hidden="true">
              <path
                d="M 1.5 1.5 L 398.5 1.5 L 200 152 Z"
                fill="#f0f0f3"
                stroke="#d8d8dc"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="env-flap-path"
              />
            </svg>

          </div>
        </div>
      </div>
    </section>
  )
}
