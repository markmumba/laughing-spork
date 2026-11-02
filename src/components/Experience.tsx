import { experience, technologies, technologyGroups } from '../lib/site-data'
import './Experience.css'

// How I work, where I've worked, and what I work with
export default function Experience() {
  return (
    <>
      <section className="block" aria-label="How I work">
        <p>
          I build backend systems that are reliable, maintainable and designed to scale, from REST
          APIs and microservices to asynchronous workflows and cloud-native applications. I’ve shipped
          production systems across fintech, e-commerce, HR and workflow automation, and I care as much
          about the engineering principles behind them as the code itself.
        </p>
      </section>

      <section id="experience" className="block" aria-labelledby="experience-title">
        <h2 id="experience-title" className="label">Experience</h2>
        <ol className="xp-list">
          {experience.map((item, i) => (
            <li key={item.role} className="xp-list__item">
              <span className="xp-list__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="xp-list__role">{item.role}</span>
              <span className="xp-list__meta">{item.company} · {item.year}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="stack" className="block" aria-labelledby="stack-title">
        <h2 id="stack-title" className="label">Stack</h2>
        <dl className="stack-list">
          {technologyGroups.map((group) => (
            <div key={group.id} className="stack-list__row">
              <dt>{group.label}</dt>
              <dd>{technologies.filter((tech) => tech.group === group.id).map((tech) => tech.name).join(', ')}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
