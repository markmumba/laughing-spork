import { Link, NavLink } from 'react-router-dom'
import './Nav.css'

// Name and role on the left, availability and the two other pages on the right.
// It sits in the reading column and scrolls away with the page.
export default function Nav() {
  return (
    <header className="site-header page">
      <Link to="/" className="site-header__id" aria-label="Markian Mumba, home">
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
