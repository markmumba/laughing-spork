import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GitHubStats } from '../lib/github-stats.types'
import Peek, { FlightPreview, ScrollPreview } from './Peek'
import './About.css'

function monthYear(value: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

// Opening statement and a short "Now", the first thing on the homepage
export default function About() {
  const [stats, setStats] = useState<GitHubStats | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/github-stats', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GitHubStats | null) => { if (data?.totalCommits) setStats(data) })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <>
      <section className="block about-intro" aria-label="About">
        <p className="statement">
          I’m a software engineer in Nairobi. I build backend systems that are reliable,
          maintainable and built to scale, and I <Peek preview={() => <FlightPreview />}><Link to="/essays" className="text-link">write</Link></Peek> about
          what I learn along the way.
        </p>
      </section>

      <section className="block about-now" aria-labelledby="now-title">
        <h2 id="now-title" className="label">Now</h2>
        <p>
          These days I’m a fullstack developer at Cloudit, and building{' '}
          <Peek preview={() => <ScrollPreview src="/previews/collectke-scroll.webp" />}>
            <a href="https://collectke.markian.fit/" target="_blank" rel="noopener noreferrer" className="text-link">CollectKE</a>
          </Peek>,
          an invoice-to-cash workspace for Kenyan businesses.
        </p>
        {stats && (
          <p className="muted">
            {stats.totalCommits.toLocaleString()} public commits since {monthYear(stats.range.start)}.
          </p>
        )}
      </section>
    </>
  )
}
