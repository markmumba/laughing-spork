import Wordmark from './Wordmark'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <Wordmark size="large" />
            <p className="footer__brand-tag">Engineer · Learner · Philosopher</p>
          </div>
          <div className="footer__links">
            <a href="https://github.com/markmumba" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/markian-mumba-67231517a/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://x.com/markmumba" target="_blank" rel="noopener noreferrer">X</a>
            <a href="mailto:mumbamarkian@gmail.com">Email</a>
            <a href="/cv.pdf" target="_blank" rel="noopener noreferrer">Resume</a>
          </div>
        </div>
        <p className="footer__copy">© 2026 Markian Mumba Mwangi. All rights reserved.</p>
      </div>
    </footer>
  )
}
