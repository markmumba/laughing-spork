import { useEffect, useState } from 'react'
import './Footer.css'

type Theme = 'light' | 'dark'

const dark = () => window.matchMedia('(prefers-color-scheme: dark)')

// index.html sets the first theme before paint; this flips it and remembers the choice.
// Until someone picks one, the page keeps following the OS setting as it changes.
function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  useEffect(() => {
    const media = dark()
    const follow = (e: MediaQueryListEvent) => {
      let saved = null
      try { saved = localStorage.getItem('theme') } catch { /* storage blocked */ }
      if (!saved) setTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', follow)
    return () => media.removeEventListener('change', follow)
  }, [])

  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="site-footer__theme"
      onClick={() => {
        try { localStorage.setItem('theme', next) } catch { /* storage blocked */ }
        setTheme(next)
      }}
    >
      {next === 'dark' ? 'Dark mode' : 'Light mode'}
    </button>
  )
}

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
      <ThemeToggle />
      <p className="site-footer__legal">© 2026 Markian Mumba Mwangi · Nairobi</p>
    </footer>
  )
}
