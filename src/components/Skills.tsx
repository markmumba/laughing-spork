import { useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import { technologies, technologyGroups as groups, type TechnologyGroupId as GroupId } from '../lib/site-data'
import './Skills.css'

const groupById = Object.fromEntries(groups.map((group) => [group.id, group])) as Record<GroupId, (typeof groups)[number]>

export default function Skills() {
  const headerRef = useReveal()
  const [filter, setFilter] = useState<GroupId | 'all'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const visible = filter === 'all' ? technologies : technologies.filter((tech) => tech.group === filter)

  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="container">
        <div ref={headerRef} className="reveal section-head">
          <h2 id="skills-title" className="section-head__title">Skills</h2>
          <p className="section-head__sub">The working set: the languages, frameworks and infrastructure I reach for most.</p>
        </div>

        <div className="skills__toolbar">
          <div className="skills__filters" role="group" aria-label="Filter by category">
            {[{ id: 'all' as const, label: 'All' }, ...groups].map((group) => (
              <button
                key={group.id}
                type="button"
                className={`filter-chip${filter === group.id ? ' filter-chip--selected' : ''}`}
                aria-pressed={filter === group.id}
                onClick={() => setFilter(group.id)}
              >
                {filter === group.id && (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                )}
                {group.label}
              </button>
            ))}
          </div>

          <div className="segmented" role="group" aria-label="Layout">
            <button type="button" className={view === 'grid' ? 'is-selected' : ''} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" /></svg>
              Grid
            </button>
            <button type="button" className={view === 'list' ? 'is-selected' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 13h2v-2H3zm0 4h2v-2H3zm0-8h2V7H3zm4 4h14v-2H7zm0 4h14v-2H7zM7 7v2h14V7z" /></svg>
              List
            </button>
          </div>
        </div>

        <ul className={`skills__items skills__items--${view}`} aria-live="polite">
          {visible.map((tech) => {
            const group = groupById[tech.group]
            return (
              <li key={tech.name} className="skill-card">
                <span className={`chip chip--dot skill-card__chip skill-card__chip--${group.tone}`}>{group.label}</span>
                <h3 className="skill-card__name">{tech.name}</h3>
                <p className="skill-card__note">{tech.note}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
