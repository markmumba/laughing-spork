import { Link, NavLink } from 'react-router-dom'
import './Nav.css'

// Name and role on the left, availability and the two other pages on the right.
// It sits in the reading column and scrolls away with the page. The homepage also
// shows the stippled portrait above the name.
export default function Nav({ portrait = false }: { portrait?: boolean }) {
  return (
    <header className={`site-header page${portrait ? ' site-header--portrait' : ''}`}>
      <Link to="/" className="site-header__id" aria-label="Markian Mumba, home">
        {portrait && (
          <img
            className="site-header__portrait"
            src="/portrait.svg"
            alt="Line drawing of Markian Mumba"
            width="1000"
            height="1111"
            fetchPriority="high"
          />
        )}
        <span className="site-header__name">Markian Mumba</span>
        <span className="site-header__role">Software Engineer</span>
      </Link>

      <div className="site-header__side">
        <span className="site-header__status">
          <span className="site-header__dot" aria-hidden="true" />
          Available
        </span>
        <nav className="site-header__nav" aria-label="Main">
          <NavLink to="/essays">Writing</NavLink>
          <NavLink to="/resume">Resume</NavLink>
        </nav>
      </div>
    </header>
  )
}
