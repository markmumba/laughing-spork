import { useRef } from 'react'
import { projects } from '../lib/site-data'
import Stepper from './Stepper'
import './Projects.css'

// Framed screenshots in a strip that runs off the right edge, captioned below
export default function Projects() {
  const trackRef = useRef<HTMLUListElement>(null)

  return (
    <section id="projects" className="block" aria-labelledby="projects-title">
      <div className="label-row">
        <h2 id="projects-title" className="label">Projects</h2>
        <Stepper track={trackRef} label="Scroll projects" />
      </div>

      <ul ref={trackRef} className="carousel project-strip">
        {projects.map((project) => (
          <li key={project.id} className="project">
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="project__frame" aria-label={`${project.name}, live site`}>
              <img src={project.image} alt="" loading="lazy" decoding="async" />
            </a>
            <div className="project__caption">
              <a href={project.demo} target="_blank" rel="noopener noreferrer" className="project__name">{project.name}</a>
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="project__code">Code</a>
            </div>
            <p className="project__about">{project.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
