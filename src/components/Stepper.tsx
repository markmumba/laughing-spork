import { useEffect, useState, type RefObject } from 'react'

// Prev/next arrows for a `.carousel` strip. Each press moves by one item, and an
// arrow disables itself at the matching end of the strip.
export default function Stepper({ track, label }: { track: RefObject<HTMLElement | null>; label: string }) {
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => {
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
    }
    el.addEventListener('scroll', measure, { passive: true })
    // Also gives the first measurement: an observer reports once as soon as it starts
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [track])

  const step = (direction: 1 | -1) => {
    const el = track.current
    const item = el?.firstElementChild as HTMLElement | null
    if (!el || !item) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: direction * (item.offsetWidth + gap), behavior: 'smooth' })
  }

  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => step(-1)} disabled={edges.start} aria-label="Previous">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
      </button>
      <button type="button" onClick={() => step(1)} disabled={edges.end} aria-label="Next">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
      </button>
    </div>
  )
}
