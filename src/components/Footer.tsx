import { Link as RouterLink } from 'react-router-dom'
import Wordmark from './Wordmark'
import './Footer.css'

const explore = [
  { label: 'Writing', href: '/#writing' },
  { label: 'About', href: '/#about' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Work', href: '/#projects' },
  { label: 'GitHub activity', href: '/#github-activity' },
]

const connect = [
  { label: 'GitHub', href: 'https://github.com/markmumba' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/markian-mumba-67231517a/' },
  { label: 'X', href: 'https://x.com/markmumba' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Wordmark />
          <p className="footer__tag">Engineer, learner, philosopher. Based in Nairobi, working worldwide.</p>
        </div>

        <nav className="footer__col" aria-label="Explore">
          <h2 className="footer__heading">Explore</h2>
          <ul>
            {explore.map((link) => <li key={link.label}><a href={link.href}>{link.label}</a></li>)}
          </ul>
        </nav>

        <nav className="footer__col" aria-label="Connect">
          <h2 className="footer__heading">Connect</h2>
          <ul>
            {connect.map((link) => <li key={link.label}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a></li>)}
            <li><a href="mailto:mumbamarkian@gmail.com">Email</a></li>
          </ul>
        </nav>

        <nav className="footer__col" aria-label="Resources">
          <h2 className="footer__heading">Resources</h2>
          <ul>
            <li><RouterLink to="/essays">All essays</RouterLink></li>
            <li><RouterLink to="/resume">Resume</RouterLink></li>
            <li><a href="/cv.pdf" target="_blank" rel="noopener noreferrer">Download CV (PDF)</a></li>
          </ul>
        </nav>
      </div>

      <div className="footer__bottom">
        <p>© 2026 Markian Mumba Mwangi</p>
        <a href="#root">Back to top</a>
      </div>
    </footer>
  )
}
