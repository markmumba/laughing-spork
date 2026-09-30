import { useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import './Skills.css'

const technologyGroups = [
  {
    id: 'languages',
    number: '01',
    name: 'Languages',
    title: 'Languages',
    technologies: ['Java', 'TypeScript', 'JavaScript', 'Python'],
  },
  {
    id: 'backend',
    number: '02',
    name: 'Back end',
    title: 'Back end',
    technologies: ['Spring Boot', 'gRPC', 'OAuth2', 'Microservices'],
  },
  {
    id: 'frontend',
    number: '03',
    name: 'Front end',
    title: 'Front end',
    technologies: ['React', 'Next.js', 'Tailwind CSS'],
  },
  {
    id: 'infrastructure',
    number: '04',
    name: 'Infrastructure',
    title: 'Infra',
    technologies: ['Docker', 'PostgreSQL', 'Linux'],
  },
] as const

export default function Skills() {
  const headerRef = useReveal()
  const [activeId, setActiveId] = useState<(typeof technologyGroups)[number]['id']>('backend')
  const activeGroup = technologyGroups.find((group) => group.id === activeId) ?? technologyGroups[1]

  return (
    <section id="skills" className="section skills-section">
      <div className="container">
        <div ref={headerRef} className="reveal">
          <p className="section__eyebrow">TECHNOLOGIES / 01-04</p>
          <h2 className="section__headline">Tools of the trade.</h2>
        </div>

        <div className="technology-exhibit">
          <span className="technology-exhibit__masthead" aria-hidden="true">The working set</span>

          <div className="technology-exhibit__covers" role="group" aria-label="Technology categories">
            {technologyGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`tech-cover tech-cover--${group.id}${activeId === group.id ? ' tech-cover--active' : ''}`}
                aria-label={`${group.name}: ${group.technologies.join(', ')}`}
                aria-pressed={activeId === group.id}
                onClick={() => setActiveId(group.id)}
              >
                <span className="tech-cover__header">
                  <span>MM / FIELD NOTES</span>
                  <span>{group.number}</span>
                </span>
                <span className="tech-cover__title">{group.title}</span>
                <span className="tech-cover__technologies">
                  {group.technologies.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </span>
                <span className="tech-cover__footer">
                  <span>TECH INDEX</span>
                  <span>{group.number} / 04</span>
                </span>
              </button>
            ))}
          </div>

          <div className="technology-exhibit__caption" aria-live="polite">
            <span>MARKIAN MUMBA MWANGI / TECHNOLOGIES</span>
            <span>{activeGroup.number} / {activeGroup.name}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
