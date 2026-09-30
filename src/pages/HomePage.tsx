import Nav from '../components/Nav'
import Hero from '../components/Hero'
import Writing from '../components/Writing'
import About from '../components/About'
import Skills from '../components/Skills'
import Projects from '../components/Projects'
import GitHubActivity from '../components/GitHubActivity'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Writing />
        <About />
        <Skills />
        <Projects />
        <GitHubActivity />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
