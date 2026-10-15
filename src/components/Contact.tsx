import { Link as RouterLink } from 'react-router-dom'
import { useReveal } from '../hooks/useReveal'
import './Contact.css'

export default function Contact() {
  const ref = useReveal()

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container">
        <div ref={ref} className="reveal contact__band">
          <h2 id="contact-title" className="contact__title">Let's build something</h2>
          <p className="contact__body">
            Open to remote work worldwide: distributed systems, backend architecture and fullstack development.
          </p>
          <div className="contact__actions">
            <a href="mailto:mumbamarkian@gmail.com" className="btn btn--filled">Email me</a>
            <a href="https://www.linkedin.com/in/markian-mumba-67231517a/" target="_blank" rel="noopener noreferrer" className="btn btn--outlined contact__outlined">LinkedIn</a>
            <RouterLink to="/resume" className="btn btn--text">View resume</RouterLink>
          </div>
          <p className="contact__email">mumbamarkian@gmail.com</p>
        </div>
      </div>
    </section>
  )
}
