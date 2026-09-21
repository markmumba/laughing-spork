import { useReveal } from '../hooks/useReveal'
import './About.css'

export default function About() {
  const headerRef = useReveal()
  const gridRef = useReveal()
  return (
    <section id="about" className="section section--white">
      <div className="container">
        <div ref={headerRef} className="reveal about__grid">
          <div className="about__left">
            <p className="section__eyebrow">ABOUT</p>
            <h2 className="section__headline">
              Software Engineer
              <br />
              specializing in backend.
            </h2>
            <p className="about__body">
              I build backend systems that are reliable, maintainable, and designed to scale—from
              REST APIs and microservices to asynchronous workflows and cloud-native applications.
            </p>
            <p className="about__body">
              My primary stack includes Java, Spring Boot, MongoDB, PostgreSQL, gRPC, Docker, and
              cloud technologies, with hands-on experience building and deploying production systems
              across fintech, e-commerce, HR systems, and workflow automation.
            </p>
            <p className="about__body">
              Beyond writing code, I am deeply interested in the engineering principles behind great
              systems—studying distributed systems, data-intensive applications, system design, and
              software architecture to continuously improve how I build software.
            </p>
            <p className="about__body">
              I enjoy collaborating with teams that value technical excellence, ownership, and
              building products that create meaningful impact.
            </p>
          </div>
          <div ref={gridRef} className="about__right stagger-reveal">
            <div className="about__card">
              <p className="about__card-label">FOCUS AREAS</p>
              <ul className="about__focus-list">
                <li>Backend architecture and API design</li>
                <li>Distributed systems and microservices</li>
                <li>Database design and performance optimization</li>
                <li>Event-driven systems and asynchronous processing</li>
                <li>Cloud infrastructure and containerized deployments</li>
                <li>Reliability, resilience, and scalable software design</li>
              </ul>
            </div>
            <div className="about__card">
              <p className="about__card-label">OPEN TO</p>
              <ul className="about__focus-list">
                <li>Backend Engineering</li>
                <li>Software Engineering</li>
                <li>Distributed Systems</li>
                <li>Platform Engineering</li>
                <li>Cloud &amp; Infrastructure Engineering</li>
              </ul>
            </div>
            <div className="about__card">
              <p className="about__card-label">EXPERIENCE</p>
              <ul className="about__exp-list">
                <li>
                  <span className="exp__role">Fullstack Developer</span>
                  <span className="exp__company">Cloudit · 2025</span>
                </li>
                <li>
                  <span className="exp__role">Backend Engineer</span>
                  <span className="exp__company">Kyosk · 2025</span>
                </li>
                <li>
                  <span className="exp__role">Freelance Developer</span>
                  <span className="exp__company">Independent · 2023</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
