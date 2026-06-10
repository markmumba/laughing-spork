import { useReveal } from '../hooks/useReveal'
import './About.css'

export default function About() {
  const headerRef = useReveal()
  const gridRef = useReveal()
  return (
    <section id="about" className="section section--white">
      <div className="container">
        <div ref={headerRef} className="reveal about__grid">
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
          <div ref={gridRef} className="about__right stagger-reveal">
            <div className="about__card">
              <p className="about__card-label">CURRENT FOCUS</p>
              <ul className="about__focus-list">
                <li>Exploring distributed systems</li>
                <li>Reading on system design principles</li>
                <li>The psychology of debugging</li>
                <li>How fintech works — RTGS, payment platforms, distributed settlement engines</li>
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
