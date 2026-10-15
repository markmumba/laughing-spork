import { useReveal } from '../hooks/useReveal'
import { projects } from '../lib/site-data'
import './Projects.css'

type Project = (typeof projects)[number]

function ProjectLinks({ project, primary = false }: { project: Project; primary?: boolean }) {
  return (
    <div className="project-links">
      <a href={project.demo} target="_blank" rel="noopener noreferrer" className={`btn ${primary ? 'btn--filled' : 'btn--text'}`}>
        Explore project
      </a>
      <a href={project.github} target="_blank" rel="noopener noreferrer" className={`btn ${primary ? 'btn--outlined' : 'btn--text'}`}>
        Source code
      </a>
    </div>
  )
}

export default function Projects() {
  const headerRef = useReveal()
  const featureRef = useReveal()
  const [featured, ...rest] = projects

  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <div className="container">
        <div ref={headerRef} className="reveal section-head">
          <h2 id="projects-title" className="section-head__title">Work</h2>
          <p className="section-head__sub">Products I've designed, built and shipped.</p>
        </div>

        <article ref={featureRef} className="reveal project-feature">
          <div className="project-feature__text">
            <span className="chip">{featured.category}</span>
            <h3 className="project-feature__name">{featured.name}</h3>
            <p className="project-feature__description">{featured.description}</p>
            <p className="project-tags">{featured.tags.join(' • ')}</p>
            <ProjectLinks project={featured} primary />
          </div>
          <a href={featured.demo} target="_blank" rel="noopener noreferrer" className="project-feature__media" tabIndex={-1} aria-hidden="true">
            <img src={featured.image} alt="" loading="lazy" decoding="async" />
          </a>
        </article>

        <div className="project-grid">
          {rest.map((project) => (
            <article key={project.id} className="project-card">
              <div className="project-card__media">
                <img src={project.image} alt={`${project.name} screenshot`} loading="lazy" decoding="async" />
              </div>
              <div className="project-card__body">
                <span className="chip">{project.category}</span>
                <h3 className="project-card__name">{project.name}</h3>
                <p className="project-card__description">{project.description}</p>
                <p className="project-tags">{project.tags.join(' • ')}</p>
                <ProjectLinks project={project} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
