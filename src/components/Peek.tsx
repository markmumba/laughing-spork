import { useEffect, useState, type ReactNode } from 'react'
import { getEssaysForHomepage, type EssayItem } from '../lib/contentful'
import { optimizeContentfulImageUrl } from '../lib/contentful-image'
import './Peek.css'

const CARD_WIDTH = 360 // must match .peek__card width

// Hover a squiggly link, get a small moving preview of where it goes. Only on devices
// with a real pointer: on touch the link just navigates.
export default function Peek({ preview, children }: { preview: () => ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  // The preview mounts on first hover and stays mounted, so it can animate out
  const [mounted, setMounted] = useState(false)
  // Sideways nudge that keeps the card inside the window when the link is near an edge
  const [shift, setShift] = useState(0)

  const show = (e: React.SyntheticEvent<HTMLSpanElement>) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const rect = e.currentTarget.getBoundingClientRect()
    const centre = rect.left + rect.width / 2
    const half = CARD_WIDTH / 2 + 16
    setShift(Math.min(0, window.innerWidth - half - centre) + Math.max(0, half - centre))
    setMounted(true)
    setOpen(true)
  }
  const hide = () => setOpen(false)

  return (
    <span className="peek" onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {mounted && (
        <span
          className={`peek__card${open ? ' is-open' : ''}`}
          style={{ '--peek-shift': `${shift}px` } as React.CSSProperties}
          aria-hidden="true"
        >
          {preview()}
        </span>
      )}
    </span>
  )
}

// ─── Previews ─────────────────────────────────────────────────────────────────

// A tall screenshot of a site, slowly scrolled top to bottom and back
export function ScrollPreview({ src }: { src: string }) {
  return (
    <span className="peek-scroll">
      <img src={src} alt="" decoding="async" />
    </span>
  )
}

let essaysRequest: Promise<EssayItem[]> | null = null

// The essays page in miniature: covers drifting toward the viewer on a loop
export function FlightPreview() {
  const [covers, setCovers] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    essaysRequest ??= getEssaysForHomepage()
    essaysRequest.then((items) => {
      if (cancelled) return
      setCovers(items
        .filter((e) => e.blogImage)
        .slice(0, 14)
        .map((e) => optimizeContentfulImageUrl(e.blogImage, { width: 200, quality: 60 })))
    })
    return () => { cancelled = true }
  }, [])

  return (
    <span className="peek-flight">
      {covers.map((src, i) => {
        // Same golden-angle scatter as the full page, kept clear of the centre
        const angle = i * 2.39996
        const r = 0.6 + ((i * 7) % 5) * 0.1
        const style = {
          '--x': `${Math.cos(angle) * r * 115}px`,
          '--y': `${Math.sin(angle) * r * 62}px`,
          '--shape': i % 3 === 1 ? '3 / 4' : i % 3 === 2 ? '1 / 1' : '4 / 3',
          animationDelay: `${(-i * 7.2) / covers.length}s`,
        } as React.CSSProperties
        return <img key={src} src={src} alt="" decoding="async" style={style} />
      })}
    </span>
  )
}
