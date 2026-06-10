import { useRef, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useReveal } from '../hooks/useReveal'
import './Skills.css'

interface SkillBranch {
  id: string; label: string; color: string
  forkX: number; trackY: number; up: boolean; trackEnd: number
  pathDelay: number
  nodes: Array<{ label: string; x: number }>
}

interface TrunkSeg { x1: number; x2: number; delay: number; dur: number }

const ST_TRUNK_Y = 258
const ST_TRUNK_X1 = 40
const CORNER_R = 14
const PATH_DUR = 1.30

const TRUNK_SEGS: TrunkSeg[] = [
  { x1: 40,  x2: 130, delay: 0,    dur: 0.65 },
  { x1: 130, x2: 220, delay: 1.75, dur: 0.50 },
  { x1: 220, x2: 370, delay: 3.35, dur: 0.68 },
  { x1: 370, x2: 500, delay: 5.13, dur: 0.60 },
  { x1: 500, x2: 972, delay: 6.83, dur: 1.05 },
]

function trunkTickDelay(x: number): number {
  for (const seg of TRUNK_SEGS) {
    if (x >= seg.x1 && x <= seg.x2) {
      return seg.delay + ((x - seg.x1) / (seg.x2 - seg.x1)) * seg.dur
    }
  }
  return 0
}

const TRUNK_TICKS = (() => {
  const SKIP = [130, 220, 370, 500]
  const out: Array<{ x: number; major: boolean; delay: number }> = []
  let i = 0
  for (let x = 58; x <= 958; x += 28) {
    if (!SKIP.some(fx => Math.abs(x - fx) < 14)) {
      out.push({ x, major: i % 4 === 0, delay: trunkTickDelay(x) })
    }
    i++
  }
  return out
})()

const SKILL_BRANCHES: SkillBranch[] = [
  {
    id: 'lang', label: 'LANGUAGES', color: '#60a5fa',
    forkX: 130, trackY: 82, up: true, trackEnd: 742,
    pathDelay: 0.65,
    nodes: [
      { label: 'Java',       x: 228 },
      { label: 'TypeScript', x: 390 },
      { label: 'JavaScript', x: 542 },
      { label: 'Python',     x: 685 },
    ],
  },
  {
    id: 'backend', label: 'BACKEND', color: '#fbbf24',
    forkX: 220, trackY: 378, up: false, trackEnd: 862,
    pathDelay: 2.25,
    nodes: [
      { label: 'Spring Boot',   x: 345 },
      { label: 'gRPC',          x: 498 },
      { label: 'OAuth2',        x: 640 },
      { label: 'Microservices', x: 802 },
    ],
  },
  {
    id: 'frontend', label: 'FRONTEND', color: '#c084fc',
    forkX: 370, trackY: 166, up: true, trackEnd: 830,
    pathDelay: 4.03,
    nodes: [
      { label: 'React',        x: 468 },
      { label: 'Next.js',      x: 612 },
      { label: 'Tailwind CSS', x: 768 },
    ],
  },
  {
    id: 'infra', label: 'INFRA', color: '#34d399',
    forkX: 500, trackY: 440, up: false, trackEnd: 964,
    pathDelay: 5.73,
    nodes: [
      { label: 'Docker',     x: 596 },
      { label: 'PostgreSQL', x: 748 },
      { label: 'Linux',      x: 882 },
    ],
  },
]

function hexAlpha(hex: string, a: number): string {
  const m: Record<string, string> = {
    '#60a5fa': `rgba(96,165,250,${a})`,
    '#c084fc': `rgba(192,132,252,${a})`,
    '#fbbf24': `rgba(251,191,36,${a})`,
    '#34d399': `rgba(52,211,153,${a})`,
  }
  return m[hex] ?? `rgba(255,255,255,${a})`
}

export default function Skills() {
  const headerRef = useReveal()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect() } },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="skills" className="section skills-section">
      <div className="container">
        <div ref={headerRef} className="reveal">
          <p className="section__eyebrow section__eyebrow--light">SKILLS</p>
          <h2 className="section__headline">Tools of the trade.</h2>
        </div>
      </div>

      <div ref={wrapRef} className={`skill-tree-wrap${visible ? ' skill-tree--visible' : ''}`}>
        <svg
          viewBox="0 0 1000 510"
          className="skill-tree-svg"
          role="img"
          aria-label="Skills as a branching tree"
        >
          {/* Ghost trunk */}
          <line x1={40} y1={ST_TRUNK_Y} x2={972} y2={ST_TRUNK_Y} className="st-trunk-ghost" />

          {/* Trunk segments */}
          {TRUNK_SEGS.map((seg, i) => (
            <line
              key={i}
              pathLength={1}
              x1={seg.x1} y1={ST_TRUNK_Y}
              x2={seg.x2} y2={ST_TRUNK_Y}
              className="st-trunk-seg"
              style={{ '--st-delay': `${seg.delay}s`, '--st-dur': `${seg.dur}s` } as CSSProperties}
            />
          ))}

          {/* Shooting-star heads on trunk */}
          {TRUNK_SEGS.map((seg, i) => {
            const headFrac = Math.min(0.28, 20 / (seg.x2 - seg.x1))
            const gapFrac  = 1 - headFrac
            return (
              <line
                key={`th-${i}`}
                pathLength={1}
                x1={seg.x1} y1={ST_TRUNK_Y}
                x2={seg.x2} y2={ST_TRUNK_Y}
                className="st-trunk-head"
                style={{ '--st-delay': `${seg.delay}s`, '--st-dur': `${seg.dur}s`, '--head-frac': headFrac, '--gap-frac': gapFrac } as CSSProperties}
              />
            )
          })}

          {/* Tick marks */}
          {TRUNK_TICKS.map((t, i) => (
            <line
              key={`tick-${i}`}
              x1={t.x} y1={ST_TRUNK_Y - (t.major ? 4.5 : 2.5)}
              x2={t.x} y2={ST_TRUNK_Y + (t.major ? 4.5 : 2.5)}
              className={`st-tick${t.major ? ' st-tick--major' : ''}`}
              style={{ animationDelay: `${t.delay}s` }}
            />
          ))}

          {/* Origin dot */}
          <circle cx={ST_TRUNK_X1 + 4} cy={ST_TRUNK_Y} r={5.5} className="st-origin" />

          {SKILL_BRANCHES.map((b) => {
            const connLen  = Math.abs(ST_TRUNK_Y - b.trackY)
            const arcLen   = (Math.PI / 2) * CORNER_R
            const totalLen = connLen + arcLen + (b.trackEnd - b.forkX - CORNER_R)

            const pathD = b.up
              ? `M ${b.forkX},${ST_TRUNK_Y} L ${b.forkX},${b.trackY + CORNER_R} Q ${b.forkX},${b.trackY} ${b.forkX + CORNER_R},${b.trackY} L ${b.trackEnd},${b.trackY}`
              : `M ${b.forkX},${ST_TRUNK_Y} L ${b.forkX},${b.trackY - CORNER_R} Q ${b.forkX},${b.trackY} ${b.forkX + CORNER_R},${b.trackY} L ${b.trackEnd},${b.trackY}`

            return (
              <g key={b.id} style={{ '--branch-color': b.color } as CSSProperties}>
                {/* Ghost branch */}
                <path d={pathD} className="st-branch-ghost" />

                {/* Fork dot */}
                <circle
                  cx={b.forkX} cy={ST_TRUNK_Y} r={6}
                  className="st-fork-dot"
                  style={{ animationDelay: `${b.pathDelay - 0.05}s` }}
                />

                {/* Branch path */}
                <path
                  pathLength={1}
                  d={pathD}
                  className="st-branch-path"
                  style={{ animationDelay: `${b.pathDelay}s` }}
                />

                {/* Shooting-star head on branch */}
                {(() => {
                  const headFrac = Math.min(0.18, 20 / totalLen)
                  const gapFrac  = 1 - headFrac
                  return (
                    <path
                      pathLength={1}
                      d={pathD}
                      className="st-branch-head"
                      style={{ '--st-delay': `${b.pathDelay}s`, '--st-dur': `${PATH_DUR}s`, '--head-frac': headFrac, '--gap-frac': gapFrac } as CSSProperties}
                    />
                  )
                })()}

                {/* Branch label */}
                <text
                  x={b.forkX + CORNER_R + 4}
                  y={b.up ? b.trackY - 38 : b.trackY + 44}
                  textAnchor="start"
                  className="st-branch-label"
                  style={{ animationDelay: `${b.pathDelay + 0.20}s`, fill: b.color }}
                >
                  {b.label}
                </text>

                {/* Nodes */}
                {b.nodes.map((n) => {
                  const nodePos = (connLen + arcLen + (n.x - (b.forkX + CORNER_R))) / totalLen
                  const nd = b.pathDelay + Math.max(0, nodePos) * PATH_DUR
                  return (
                    <g key={n.label} className="st-node" style={{ animationDelay: `${nd}s` }}>
                      <circle cx={n.x} cy={b.trackY} r={6} className="st-node__dot" />
                      <text
                        x={n.x}
                        y={b.up ? b.trackY - 16 : b.trackY + 24}
                        textAnchor="middle"
                        className="st-node__label"
                      >
                        {n.label}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>

        {/* Mobile fallback */}
        <div className="skill-tree-fallback" aria-hidden="true">
          {SKILL_BRANCHES.map((b) => (
            <div key={b.id} className="st-fb-group">
              <p className="st-fb-label" style={{ color: b.color }}>{b.label}</p>
              <div className="st-fb-pills">
                {b.nodes.map((n) => (
                  <span
                    key={n.label}
                    className="st-fb-pill"
                    style={{
                      color: b.color,
                      borderColor: hexAlpha(b.color, 0.3),
                      background: hexAlpha(b.color, 0.08),
                    }}
                  >
                    {n.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
