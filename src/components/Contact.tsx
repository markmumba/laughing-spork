import { Link as RouterLink } from 'react-router-dom'
import './Contact.css'

export default function Contact() {
  return (
    <section id="contact" className="block contact" aria-label="Contact">
      <p>
        I’m open to remote work worldwide in backend engineering, distributed systems and platform
        roles, with teams who value ownership and technical excellence.
      </p>
      <p>
        If that sounds like your team,{' '}
        <a href="mailto:mumbamarkian@gmail.com" className="text-link">reach out</a>, or read
        my <RouterLink to="/resume" className="text-link">resume</RouterLink>.
      </p>
    </section>
  )
}
