import { useEffect, useRef, useState } from 'react'
import { projects } from '../lib/site-data'
import './Projects.css'

const SIDE_SCALE = 0.8   // neighbours sit smaller than the active project
const GAP = 64           // space between frames (px, after scaling), shrunk on phones below
const DRAG_STEP = 60     // a shorter drag than one frame still moves one project past this

// Horizontal offset of a frame `d` places from the active one, for a frame width `w`
// Narrow frames get a narrower gap, so a sliver of each neighbour still shows on phones
function gapFor(w: number): number {
  return Math.min(GAP, w * 0.08)
}

function offset(d: number, w: number): number {
  if (d === 0) return 0
  const gap = gapFor(w)
  const first = w / 2 + gap + (w * SIDE_SCALE) / 2
  return Math.sign(d) * (first + (Math.abs(d) - 1) * (w * SIDE_SCALE + gap))
}

// The active project sits in the column; neighbours peek in, smaller, on both sides.
// Drag, click a neighbour, use the arrows or the arrow keys to move along.
export default function Projects() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  // Same formula as --slide-w in Projects.css, so the first paint is already in place
  const [width, setWidth] = useState(() => {
    const gutter = window.innerWidth <= 640 ? 20 : 24
    return Math.min(540, window.innerWidth - gutter * 2 - 48)
  })
  const [drag, setDrag] = useState<{ startX: number; dx: number } | null>(null)
  const last = projects.length - 1
  // Reduced motion gets the still screenshot instead of the scrolling video
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  // Frame width comes from the CSS (it follows the column); offsetWidth ignores the scale
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(() => {
      const frame = stage.querySelector<HTMLElement>('.project')
      if (frame) setWidth(frame.offsetWidth)
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const go = (i: number) => setActive(Math.max(0, Math.min(last, i)))

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    setDrag({ startX: e.clientX, dx: 0 })
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.startX
    if (Math.abs(dx) > 4 && !e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ ...drag, dx })
  }
  const onPointerUp = () => {
    if (!drag) return
    const steps = Math.round(-drag.dx / (width * SIDE_SCALE + gapFor(width)))
    if (steps) go(active + steps)
    else if (Math.abs(drag.dx) > DRAG_STEP) go(active - Math.sign(drag.dx))
    setDrag(null)
  }
  // A real drag shouldn't also count as a click on the frame under the pointer
  const wasDrag = () => Math.abs(drag?.dx ?? 0) > 4

  // Resist at the ends, so the strip feels attached rather than free-floating
  const dx = drag?.dx ?? 0
  const pastEdge = (active === 0 && dx > 0) || (active === last && dx < 0)
  const dragOffset = pastEdge ? dx * 0.3 : dx

  return (
    <section id="projects" className="block" aria-labelledby="projects-title" aria-roledescription="carousel">
      <div className="label-row">
        <h2 id="projects-title" className="label">Projects</h2>
        <div className="stepper" role="group" aria-label="Choose project">
          <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous project">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
          </button>
          <button type="button" onClick={() => go(active + 1)} disabled={active === last} aria-label="Next project">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`project-stage${drag && wasDrag() ? ' is-dragging' : ''}`}
        tabIndex={0}
        aria-label={`Project ${active + 1} of ${projects.length}: ${projects[active].name}. Use the arrow keys to move.`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1) }
          if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1) }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {projects.map((project, i) => {
          const d = i - active
          const isActive = d === 0
          const style = {
            transform: `translateX(calc(-50% + ${offset(d, width) + dragOffset}px)) scale(${isActive ? 1 : SIDE_SCALE})`,
          }
          return (
            <article key={project.id} className={`project${isActive ? ' is-active' : ''}`} style={style} aria-hidden={!isActive}>
              {isActive ? (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project__frame"
                  draggable={false}
                  onClick={(e) => { if (wasDrag()) e.preventDefault() }}
                >
                  {project.video && !reducedMotion ? (
                    <video
                      key={project.video}
                      src={project.video}
                      poster={project.image}
                      aria-label={`${project.name}, scrolling through the live site`}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img src={project.image} alt={`${project.name}, live site`} draggable={false} decoding="async" />
                  )}
                </a>
              ) : (
                <button type="button" className="project__frame" tabIndex={-1} onClick={() => { if (!wasDrag()) go(i) }}>
                  <img src={project.image} alt="" draggable={false} loading={Math.abs(d) < 2 ? 'eager' : 'lazy'} decoding="async" />
                </button>
              )}
              <div className="project__caption">
                <a href={project.demo} target="_blank" rel="noopener noreferrer" className="project__name" tabIndex={isActive ? 0 : -1}>
                  <span className="squiggle-on-hover">{project.name}</span>
                </a>
                <span className="project__meta">
                  {project.category}
                  {' · '}
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="project__code" tabIndex={isActive ? 0 : -1}>Code</a>
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
