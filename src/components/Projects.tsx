import { useReveal } from '../hooks/useReveal'
import './Projects.css'

const projects = [
  {
    id: 1,
    name: 'FolioCuts',
    category: 'PLATFORM',
    description:
      'Digital barbershop management for Kenyan shops. Commission tracking, M-Pesa STK push, automated receipts, loyalty rewards, live analytics, staff dashboards. 3-minute onboarding.',
    tags: ['Spring Boot', 'Next.js', 'M-Pesa', 'PostgreSQL'],
    github: 'https://github.com/markmumba/foliocuts-backend',
    demo: 'https://folio.blazor-movies.online/',
    image: '/projects/foliocuts.png',
  },
  {
    id: 2,
    name: 'Garbage Collection System',
    category: 'FULLSTACK',
    description:
      'Waste management platform connecting households with local collectors. Real-time pickup tracking, automated payments and payouts.',
    tags: ['Next.js', 'Spring Boot', 'PostgreSQL'],
    github: 'https://github.com/markmumba/bolloapp-backend/tree/new-architecture',
    demo: 'https://bolla.blazor-movies.online/',
    image: '/projects/bolloapp.webp',
  },
  {
    id: 3,
    name: 'Rentitup',
    category: 'MARKETPLACE',
    description:
      'Rental platform connecting machinery owners with users — from contractors to homeowners.',
    tags: ['Next.js', 'Spring Boot'],
    github: 'https://github.com/markmumba/rentitup-microservice',
    demo: 'https://rentitup.blazor-movies.online/',
    image: '/projects/rentitup.webp',
  },
  {
    id: 4,
    name: 'ESTC Website',
    category: 'CORPORATE',
    description:
      'Website for a professional training organization offering Leadership, ICT, and HR programs.',
    tags: ['Next.js', 'CMS'],
    github: 'https://github.com/markmumba/estc',
    demo: 'https://exceptionalskills.co.ke/',
    image: '/projects/estc.webp',
  },
  {
    id: 5,
    name: 'Bag Street Kenya',
    category: 'E-COMMERCE',
    description:
      'E-commerce platform for bags, shoes, and scarves with WhatsApp integration.',
    tags: ['Next.js', 'WhatsApp API'],
    github: 'https://github.com/markmumba/bag_street_kenya',
    demo: 'https://bagstreetke.co.ke/',
    image: '/projects/bagstreet.webp',
  },
]

function ProjectCard({ project }: { project: (typeof projects)[0] }) {
  return (
    <div className="project-card">
      <a
        href={project.demo}
        target="_blank"
        rel="noopener noreferrer"
        className="project-card__preview"
        aria-label={`${project.name} live demo`}
        tabIndex={-1}
      >
        <img
          src={project.image}
          alt={`${project.name} screenshot`}
          className="project-card__img"
          width="600"
          height="375"
          loading="lazy"
          decoding="async"
        />
        <div className="project-card__preview-overlay">
          <span>View Demo ›</span>
        </div>
      </a>
      <div className="project-card__body">
        <p className="project-card__category">{project.category}</p>
        <h3 className="project-card__name">{project.name}</h3>
        <p className="project-card__desc">{project.description}</p>
        <div className="project-card__tags">
          {project.tags.map((tag) => (
            <span key={tag} className="project-card__tag">{tag}</span>
          ))}
        </div>
        <div className="project-card__links">
          <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-card__link">
            GitHub ›
          </a>
          <a href={project.demo} target="_blank" rel="noopener noreferrer" className="project-card__link">
            Demo ›
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const headerRef = useReveal()
  const gridRef = useReveal()
  return (
    <section id="projects" className="section section--white">
      <div className="container">
        <div ref={headerRef} className="reveal">
          <p className="section__eyebrow">PROJECTS</p>
          <h2 className="section__headline">Things I've built.</h2>
        </div>
        <div ref={gridRef} className="projects__grid stagger-reveal">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
