import { useEffect, useState } from 'react'
import { usePageMeta } from '../lib/usePageMeta'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import './ResumePage.css'

// ─── Data ────────────────────────────────────────────────────────────────────

const experience = [
  {
    role: 'Fullstack Engineer',
    company: 'Cloud IT',
    period: 'August 2025 – Present',
    bullets: [
      'Designed, developed, and deployed backend services and RESTful APIs using Java (Spring Boot) to support scalable client e-commerce and MIS platforms.',
      'Implemented CI/CD pipelines using GitLab CI/CD, automating deployments to GCP and Azure, ensuring secure, high-availability releases.',
      'Containerized distributed microservices using Docker, standardizing deployments and simplifying environment setup for developers.',
      'Collaborated with frontend and product teams to integrate Angular applications via secure, versioned APIs.',
      'Authored and maintained technical documentation with Docusaurus, improving onboarding efficiency across cross-functional teams.',
    ],
  },
  {
    role: 'Backend Engineer Intern',
    company: 'Kyosk',
    period: 'January 2025 – April 2025',
    bullets: [
      'Developed microservices for payment processing and transaction workflows using Spring Boot and REST APIs, ensuring reliable system communication and data consistency.',
      'Built and executed unit and integration tests with JUnit and Mockito, maintaining over 80% coverage and minimizing regression issues.',
      'Wrote Technical Requirements Documents (TRDs) for payment integrations, promoting consistent and compliant implementation across teams.',
      'Collaborated with senior engineers in code reviews and system design discussions, strengthening scalability and maintainability of backend systems.',
      'Delivered features using Agile methods, Git version control, and code review practices to ensure secure, maintainable backend systems.',
    ],
  },
]

const projects = [
  {
    name: 'RentItUp',
    url: 'https://rentitup.markian.fit',
    tags: ['Spring Boot', 'Next.js', 'PostgreSQL', 'gRPC', 'OAuth2'],
    bullets: [
      'Designed and built a machinery rental marketplace across four independently deployable microservices supporting real-time availability, booking, and payment workflows.',
      'Implemented a caching layer with PostgreSQL unlogged tables and inter-service communication using gRPC with Eureka-based service discovery and load balancing.',
      'Secured the platform with a dedicated OAuth2/OIDC authorisation server supporting role-based access control and automated service-to-service credentials.',
      'Built a shared infrastructure module standardising authentication, error handling, and service communication across all services.',
    ],
  },
  {
    name: 'Foliocuts',
    url: 'https://folio.blazor-movies.online/',
    tags: ['Spring Boot', 'Next.js', 'M-Pesa', 'PostgreSQL'],
    bullets: [
      'Designed and implemented a backend-driven barbershop management system to digitise payments, commissions, and operational reporting.',
      'Built RESTful APIs for transactions, staff commissions, customer loyalty, and role-based dashboards using secure authentication and authorisation.',
      'Integrated M-Pesa STK Push payments with automated transaction recording, receipt generation, and reconciliation logic.',
      'Deployed in a production environment with environment-based configuration and secure secrets management.',
    ],
  },
  {
    name: 'BolloApp',
    url: 'https://bolla.blazor-movies.online/',
    tags: ['Spring Boot', 'Next.js', 'MTN MoMo', 'Docker'],
    bullets: [
      'Engineered backend services for a smart waste management platform using Spring Boot, exposing real-time APIs for scheduling, billing, and collections.',
      'Integrated MTN MoMo payments to automate customer billing and transaction verification workflows.',
      'Containerised services and deployed to a VPS with CI/CD pipelines for reliable and repeatable releases.',
      'Implemented authentication, input validation, and notification logic for secure and consistent system behaviour.',
    ],
  },
]

const education = [
  { degree: 'Bachelor of Computer Science', school: 'Riara University', year: 'Graduated 2025' },
  { degree: 'Web Development Certificate', school: 'Moringa School', year: '2020' },
]

const skills: Record<string, string[]> = {
  Languages: ['Java', 'JavaScript', 'TypeScript', 'Python'],
  Frameworks: ['Spring Boot', 'Next.js', 'React', 'Tailwind CSS'],
  Databases: ['PostgreSQL', 'MongoDB'],
  Tools: ['Docker', 'Git', 'GitLab CI/CD', 'Azure', 'GCP', 'Nginx', 'Linux'],
  Concepts: ['REST APIs', 'Microservices', 'CI/CD', 'System Design', 'Security', 'Scalability', 'Cloud Deployment', 'gRPC', 'OAuth2/OIDC', 'Testing (JUnit, Mockito)', 'Domain-Driven Design', 'Event-Driven Architecture'],
}

const sections = [
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResumePage() {
  usePageMeta({
    title: 'Resume',
    description: 'Fullstack Developer specializing in Java, Spring Boot, distributed systems, and microservices. Based in Nairobi, Kenya.',
  })
  const [active, setActive] = useState(sections[0].id)

  // Highlight the "On this page" entry for the section nearest the top
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      let current = sections[0].id
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.3) current = section.id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1].id
      setActive(current)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className="resume-page">
      <Nav page="resume" />

      <main>
        <header className="resume-header">
          <h1 className="resume-header__name">Markian Mumba</h1>
          <p className="resume-header__title">Fullstack Developer • Backend Engineer</p>
          <ul className="resume-header__contact" aria-label="Contact information">
            <li><span className="chip">Nairobi, Kenya</span></li>
            <li><a className="chip" href="mailto:mumbamarkian@gmail.com">mumbamarkian@gmail.com</a></li>
            <li><a className="chip" href="tel:+254798169252">+254 798 169 252</a></li>
            <li><a className="chip" href="https://www.linkedin.com/in/markian-mumba-67231517a/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a className="chip" href="https://github.com/markmumba" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          </ul>
          <div className="resume-header__actions">
            <a href="/cv.pdf" target="_blank" rel="noopener noreferrer" className="btn btn--filled">Download PDF</a>
            <a href="mailto:mumbamarkian@gmail.com" className="btn btn--outlined">Email me</a>
          </div>
        </header>

        <div className="resume-layout">
          <nav className="resume-toc" aria-label="On this page">
            <p className="resume-toc__title">On this page</p>
            <ul>
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={active === section.id ? 'is-active' : undefined}
                    aria-current={active === section.id ? 'location' : undefined}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="resume-content">
            <section id="experience" className="resume-section" aria-labelledby="exp-heading">
              <h2 id="exp-heading" className="resume-section__heading">Experience</h2>
              {experience.map((job) => (
                <article key={`${job.company}-${job.role}`} className="resume-entry">
                  <div className="resume-entry__header">
                    <div>
                      <h3 className="resume-entry__role">{job.role}</h3>
                      <p className="resume-entry__org">{job.company}</p>
                    </div>
                    <span className="resume-entry__period">{job.period}</span>
                  </div>
                  <ul className="resume-entry__bullets">
                    {job.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </article>
              ))}
            </section>

            <section id="projects" className="resume-section" aria-labelledby="proj-heading">
              <h2 id="proj-heading" className="resume-section__heading">Projects</h2>
              {projects.map((p) => (
                <article key={p.name} className="resume-entry">
                  <div className="resume-entry__header">
                    <h3 className="resume-entry__role">
                      <a href={p.url} target="_blank" rel="noopener noreferrer">{p.name}</a>
                    </h3>
                  </div>
                  <div className="resume-entry__tags">
                    {p.tags.map((t) => <span key={t} className="chip">{t}</span>)}
                  </div>
                  <ul className="resume-entry__bullets">
                    {p.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </article>
              ))}
            </section>

            <section id="education" className="resume-section" aria-labelledby="edu-heading">
              <h2 id="edu-heading" className="resume-section__heading">Education</h2>
              {education.map((e) => (
                <article key={e.school} className="resume-entry resume-entry--compact">
                  <div className="resume-entry__header">
                    <div>
                      <h3 className="resume-entry__role">{e.degree}</h3>
                      <p className="resume-entry__org">{e.school}</p>
                    </div>
                    <span className="resume-entry__period">{e.year}</span>
                  </div>
                </article>
              ))}
            </section>

            <section id="skills" className="resume-section" aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="resume-section__heading">Skills</h2>
              <dl className="resume-skills">
                {Object.entries(skills).map(([category, items]) => (
                  <div key={category} className="resume-skills__group">
                    <dt className="resume-skills__category">{category}</dt>
                    <dd className="resume-skills__tags">
                      {items.map((skill) => <span key={skill} className="chip">{skill}</span>)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
