import { useReveal } from '../hooks/useReveal'
import { experience } from '../lib/site-data'
import './About.css'

const focusAreas = [
  'Backend architecture and API design',
  'Distributed systems and microservices',
  'Database design and performance optimization',
  'Event-driven systems and asynchronous processing',
  'Cloud infrastructure and containerized deployments',
  'Reliability, resilience, and scalable software design',
]

const openTo = [
  'Backend Engineering',
  'Software Engineering',
  'Distributed Systems',
  'Platform Engineering',
  'Cloud & Infrastructure Engineering',
]

export default function About() {
  const textRef = useReveal()
  const cardsRef = useReveal()
  return (
    <section id="about" className="section section--surface" aria-labelledby="about-title">
      <div className="container">
        <div className="about__grid">
          <div ref={textRef} className="reveal about__text">
            <span className="chip">About</span>
            <h2 id="about-title" className="about__title">Software engineer specializing in backend.</h2>
            <p className="about__lead">
              I build backend systems that are reliable, maintainable, and designed to scale, from
              REST APIs and microservices to asynchronous workflows and cloud-native applications.
            </p>
            <p className="about__body">
              My primary stack includes Java, Spring Boot, MongoDB, PostgreSQL, gRPC, Docker, and
              cloud technologies, with hands-on experience building and deploying production systems
              across fintech, e-commerce, HR systems, and workflow automation.
            </p>
            <p className="about__body">
              Beyond writing code, I am deeply interested in the engineering principles behind great
              systems: distributed systems, data-intensive applications, system design, and software
              architecture.
            </p>
            <p className="about__body">
              I enjoy collaborating with teams that value technical excellence, ownership, and
              building products that create meaningful impact.
            </p>
          </div>

          <div ref={cardsRef} className="about__cards stagger-reveal">
            <div className="about__card">
              <h3 className="about__card-title">Focus areas</h3>
              <ul className="about__list">
                {focusAreas.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="about__card">
              <h3 className="about__card-title">Experience</h3>
              <ul className="about__exp">
                {experience.map((item) => (
                  <li key={item.role}>
                    <span className="about__exp-role">{item.role}</span>
                    <span className="about__exp-meta">{item.company} • {item.year}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="about__card">
              <h3 className="about__card-title">Open to</h3>
              <div className="about__chips">
                {openTo.map((item) => <span key={item} className="chip">{item}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
