import { Link } from 'react-router-dom'
import './Hero.css'

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__inner">
        <div className="hero__topline">
          <span>Portfolio</span>
          <span>Nairobi, Kenya · Available worldwide</span>
        </div>

        <div className="hero__heading">
          <h1 className="hero__title">
            <span>Multidisciplinary</span>
            <span>developer<span className="hero__period">.</span></span>
          </h1>
          <p className="hero__intro">
            I build thoughtful digital experiences, from the systems underneath
            to the details on screen.
          </p>
        </div>

        <div className="hero__showcase">
          <Link to="/resume" className="hero__discipline hero__discipline--left">
            <span className="hero__discipline-index">01 /</span>
            Systems <span aria-hidden="true">↗</span>
          </Link>

          <a href="#projects" className="hero__object" aria-label="Explore projects" data-cursor="EXPLORE">
            <img src="/retro-monitor.png" alt="Vintage cream CRT monitor" />
          </a>

          <a href="#projects" className="hero__discipline hero__discipline--right">
            <span className="hero__discipline-index">02 /</span>
            Interfaces <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="hero__bottomline">
          <Link to="/essays" className="hero__journal">Ideas &amp; writing <span aria-hidden="true">↗</span></Link>
          <div className="hero__actions">
            <a href="#projects">View work <span aria-hidden="true">↗</span></a>
            <a href="#contact">Work with me <span aria-hidden="true">↗</span></a>
          </div>
          <span className="hero__scroll">Scroll to explore ↓</span>
        </div>
      </div>
    </section>
  )
}
