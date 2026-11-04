import Nav from '../components/Nav'
import About from '../components/About'
import Projects from '../components/Projects'
import Experience from '../components/Experience'
import Writing from '../components/Writing'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="page">
        <About />
        <Projects />
        <Experience />
        <Writing />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
