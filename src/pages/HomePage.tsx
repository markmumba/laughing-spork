import { useRef } from 'react'
import Nav from '../components/Nav'
import About from '../components/About'
import Projects from '../components/Projects'
import Experience from '../components/Experience'
import Writing from '../components/Writing'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import PencilMargin from '../components/PencilMargin'

export default function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={pageRef} className="home">
      <PencilMargin root={pageRef} />
      <Nav />
      <main className="page">
        <About />
        <Projects />
        <Experience />
        <Writing />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
