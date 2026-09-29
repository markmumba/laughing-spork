import { useRef, useState, type KeyboardEvent } from 'react'
import { useReveal } from '../hooks/useReveal'
import './Projects.css'

const projects = [
  {
    id: 1,
    name: 'FolioCuts',
    tabLabel: 'FolioCuts',
    category: 'PLATFORM',
    description: 'Digital barbershop management for Kenyan shops. Commission tracking, M-Pesa STK push, automated receipts, loyalty rewards, live analytics, staff dashboards. 3-minute onboarding.',
    tags: ['Spring Boot', 'Next.js', 'M-Pesa', 'PostgreSQL'],
    diagramTitle: 'From service to settlement',
    diagram: ['Shop activity', 'M-Pesa payment', 'Receipts + analytics'],
    github: 'https://github.com/markmumba/foliocuts-backend',
    demo: 'https://foliocuts.markian.fit/',
  },
  {
    id: 2,
    name: 'Garbage Collection System',
    tabLabel: 'Garbage Collection',
    category: 'FULLSTACK',
    description: 'Waste management platform connecting households with local collectors. Real-time pickup tracking, automated payments and payouts.',
    tags: ['Next.js', 'Spring Boot', 'PostgreSQL'],
    diagramTitle: 'From household to collector',
    diagram: ['Households', 'Pickup tracking', 'Collector payouts'],
    github: 'https://github.com/markmumba/bolloapp-backend/tree/new-architecture',
    demo: 'https://bolla.blazor-movies.online/',
  },
  {
    id: 3,
    name: 'Rentitup',
    tabLabel: 'Rentitup',
    category: 'MARKETPLACE',
    description: 'Rental platform connecting machinery owners with users — from contractors to homeowners.',
    tags: ['Next.js', 'Spring Boot'],
    diagramTitle: 'From owner to renter',
    diagram: ['Machinery owners', 'Rental marketplace', 'Contractors + homeowners'],
    github: 'https://github.com/markmumba/rentitup-microservice',
    demo: 'https://rentitup.markian.fit',
  },
  {
    id: 4,
    name: 'Agamemnon',
    tabLabel: 'Agamemnon',
    category: 'CINEMATIC',
    description: 'Cinematic tribute site for the High King of Mycenae. Immersive visual storytelling with dramatic typography and atmospheric design.',
    tags: ['Next.js', 'CSS'],
    diagramTitle: 'From myth to experience',
    diagram: ['Mycenaean history', 'Visual storytelling', 'Immersive website'],
    github: 'https://github.com/markmumba/agamemnon',
    demo: 'https://agamemnon.markian.fit',
  },
  {
    id: 5,
    name: 'Bag Street Kenya',
    tabLabel: 'Bag Street',
    category: 'E-COMMERCE',
    description: 'E-commerce platform for bags, shoes, and scarves with WhatsApp integration.',
    tags: ['Next.js', 'WhatsApp API'],
    diagramTitle: 'From storefront to conversation',
    diagram: ['Bags + shoes + scarves', 'Online storefront', 'WhatsApp connection'],
    github: 'https://github.com/markmumba/bag_street_kenya',
    demo: 'https://bagstreetke.co.ke/',
  },
]

export default function Projects() {
  const headerRef = useReveal()
  const [activeIndex, setActiveIndex] = useState(0)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])
  const project = projects[activeIndex]

  function selectWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % projects.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + projects.length) % projects.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = projects.length - 1
    else return

    event.preventDefault()
    setActiveIndex(next)
    tabsRef.current[next]?.focus()
  }

  return (
    <section id="projects" className="section section--white">
      <div className="container">
        <div ref={headerRef} className="reveal">
          <p className="section__eyebrow">PROJECTS</p>
          <h2 className="section__headline">Things I've built.</h2>
        </div>

        <div className="project-browser">
          <div className="project-browser__tabs" role="tablist" aria-label="Projects">
            {projects.map((item, index) => (
              <button
                key={item.id}
                ref={(element) => { tabsRef.current[index] = element }}
                type="button"
                role="tab"
                id={`project-tab-${item.id}`}
                aria-controls="project-panel"
                aria-selected={index === activeIndex}
                tabIndex={index === activeIndex ? 0 : -1}
                className="project-browser__tab"
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => selectWithKeyboard(event, index)}
              >
                <span className="project-browser__tab-number">0{index + 1}</span>
                <span className="project-browser__tab-label">{item.tabLabel}</span>
              </button>
            ))}
          </div>

          <div className="project-browser__panel" role="tabpanel" id="project-panel" aria-labelledby={`project-tab-${project.id}`} tabIndex={0}>
            <div className="project-browser__info">
              <p className="project-browser__category">0{activeIndex + 1} / {project.category}</p>
              <h3 className="project-browser__name">{project.name}</h3>
              <p className="project-browser__description">{project.description}</p>
              <div className="project-browser__tags" aria-label="Technologies">
                {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <div className="project-browser__links">
                <a href={project.demo} target="_blank" rel="noopener noreferrer">Explore project ↗</a>
                <a href={project.github} target="_blank" rel="noopener noreferrer">Source code ↗</a>
              </div>
            </div>
            <div className="project-browser__folio" aria-label={`${project.name} project notes`}>
              <div className="project-browser__folio-header">
                <span>PROJECT FILE / 0{activeIndex + 1}</span>
                <span>MARKIAN MUMBA</span>
              </div>
              <div className="project-browser__folio-body">
                <p className="project-browser__folio-label">{project.category} / IN FOCUS</p>
                <h4 className="project-browser__folio-title">{project.diagramTitle}</h4>
                <ol className="project-browser__diagram">
                  {project.diagram.map((step, index) => (
                    <li key={step}>
                      <span className="project-browser__diagram-number">0{index + 1}</span>
                      <span className="project-browser__diagram-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="project-browser__folio-footer">
                <span>{project.name}</span>
                <span>0{activeIndex + 1} / 0{projects.length}</span>
              </div>
            </div>
          </div>

          <div className="project-browser__footer">
            <span>0{activeIndex + 1} <span className="project-browser__footer-separator">/</span> 0{projects.length}</span>
            <div className="project-browser__controls">
              <button type="button" onClick={() => setActiveIndex((activeIndex - 1 + projects.length) % projects.length)} aria-label="Previous project" title="Previous project">←</button>
              <button type="button" onClick={() => setActiveIndex((activeIndex + 1) % projects.length)} aria-label="Next project" title="Next project">→</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
