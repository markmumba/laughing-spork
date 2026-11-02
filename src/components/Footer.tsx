import './Footer.css'

const links = [
  { label: 'GitHub', href: 'https://github.com/markmumba' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/markian-mumba-67231517a/' },
  { label: 'X', href: 'https://x.com/markmumba' },
  { label: 'CV (PDF)', href: '/cv.pdf' },
]

export default function Footer() {
  return (
    <footer className="site-footer page">
      <a href="mailto:mumbamarkian@gmail.com" className="site-footer__email">mumbamarkian@gmail.com</a>
      <nav className="site-footer__links" aria-label="Elsewhere">
        {links.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
        ))}
      </nav>
      <p className="site-footer__legal">© 2026 Markian Mumba Mwangi · Nairobi</p>
    </footer>
  )
}
