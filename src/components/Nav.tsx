import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Nav.css'

const LAUGH_FOR = 1800 // ms a tap or key press keeps the laugh

// The stippled portrait, which laughs on hover, tap or Enter. The laughing drawing
// lines up exactly with the smiling one, so swapping the two reads as a change of face.
function Portrait() {
  const [laughing, setLaughing] = useState(false)
  // Bumped on every laugh so the chuckle animation restarts each time
  const [chuckle, setChuckle] = useState(0)
  // The laughing drawing downloads after the page has loaded, or on first hover if sooner
  const [laughSrc, setLaughSrc] = useState<string | null>(null)
  const timer = useRef(0)

  useEffect(() => {
    const load = () => setLaughSrc('/portrait-laugh.svg')
    if (document.readyState === 'complete') {
      const id = window.setTimeout(load, 300)
      return () => window.clearTimeout(id)
    }
    window.addEventListener('load', load, { once: true })
    return () => window.removeEventListener('load', load)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const laugh = () => {
    setLaughSrc('/portrait-laugh.svg')
    setLaughing(true)
    setChuckle((n) => n + 1)
  }

  return (
    <button
      type="button"
      className={`site-header__portrait${laughing ? ' is-laughing' : ''}`}
      aria-label="Drawing of Markian Mumba. Press to make him laugh"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') laugh() }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setLaughing(false) }}
      onClick={() => {
        // Taps and key presses have no "leave", so the laugh times out on its own
        laugh()
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setLaughing(false), LAUGH_FOR)
      }}
    >
      <span key={chuckle} className={`site-header__face${chuckle ? ' is-chuckling' : ''}`}>
        <img src="/portrait.svg" alt="" width="1000" height="1111" fetchPriority="high" />
        {laughSrc && <img className="site-header__laugh" src={laughSrc} alt="" width="1000" height="1111" />}
      </span>
    </button>
  )
}

// Name and role on the left, availability and the two other pages on the right.
// It sits in the reading column and scrolls away with the page. The homepage also
// shows the stippled portrait.
export default function Nav({ portrait = false }: { portrait?: boolean }) {
  return (
    <header className={`site-header page${portrait ? ' site-header--portrait' : ''}`}>
      {portrait && <Portrait />}

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
