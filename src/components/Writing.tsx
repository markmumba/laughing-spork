import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getEssayCount, getEssaysForHomepage, type EssayItem } from '../lib/contentful'
import Stepper from './Stepper'
import './Writing.css'

const SHOWN = 6

function extractText(rich: unknown): string {
  if (typeof rich === 'string') return rich
  if (rich && typeof rich === 'object' && 'content' in rich) {
    const r = rich as { content?: Array<{ content?: Array<{ value?: string }> }> }
    return r.content?.[0]?.content?.[0]?.value ?? ''
  }
  return ''
}

// Series essays open with "Over-Engineered on Purpose — Part 12: …" and a "This is Part 12 of
// a series…" recap; both repeat what the card already says, so the excerpt skips them
const SERIES_LINE = /—\s*Part \d+:|^This is Part \d+ of a series/

// Opening text of the essay, from body paragraphs only (headings repeat the title)
function openingText(rich: unknown, chars = 700): string {
  if (!rich || typeof rich !== 'object') return ''
  const root = rich as { content?: Array<{ nodeType?: string }> }
  const parts: string[] = []
  for (const block of root.content ?? []) {
    if (block.nodeType !== 'paragraph') continue
    const words: string[] = []
    const walk = (node: unknown) => {
      const n = node as { value?: unknown; content?: unknown[] }
      if (typeof n.value === 'string') words.push(n.value)
      if (Array.isArray(n.content)) n.content.forEach(walk)
    }
    walk(block)
    const text = words.join('').trim()
    if (!text || SERIES_LINE.test(text)) continue
    parts.push(text)
    if (parts.join(' ').length > chars) break
  }
  return parts.join(' ').slice(0, chars)
}

// "02/2026", as the date reads on the cards
function monthSlashYear(raw: string): string {
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

// Each card is a miniature page of the essay: title, date, then its opening text
export default function Writing() {
  const trackRef = useRef<HTMLUListElement>(null)
  const [essays, setEssays] = useState<EssayItem[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    getEssaysForHomepage().then((items) => setEssays(items.slice(0, SHOWN)))
    // The homepage fetch is capped, so the real total comes from a separate count
    getEssayCount().then(setTotal)
  }, [])

  return (
    <section id="writing" className="block" aria-labelledby="writing-title">
      <div className="label-row">
        <h2 id="writing-title" className="label">Writing</h2>
        <Stepper track={trackRef} label="Scroll essays" />
      </div>

      <ul ref={trackRef} className="carousel note-strip">
        {essays.map((essay) => {
          const title = extractText(essay.title)
          const date = monthSlashYear(extractText(essay.publishDate as string))
          const text = openingText(essay.article)
          return (
            <li key={essay.id} className="note">
              <RouterLink to={`/essays/${essay.id}`} className="note__link">
                <div className="note__page" aria-hidden="true">
                  <p className="note__page-title">{title}</p>
                  <p className="note__page-date">{date}</p>
                  <p className="note__page-text">{text}</p>
                </div>
                <div className="note__caption">
                  <span className="note__title">{title}</span>
                  <span className="note__date">{date}</span>
                </div>
              </RouterLink>
            </li>
          )
        })}
        {essays.length > 0 && (
          <li className="note">
            <RouterLink to="/essays" className="note__link">
              <div className="note__page note__page--all">
                <span>{total ? `All ${total} essays` : 'All essays'}</span>
                <span className="muted">Fly through them →</span>
              </div>
            </RouterLink>
          </li>
        )}
      </ul>
    </section>
  )
}
