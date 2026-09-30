import { useEffect, useMemo, useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import type { GitHubStats } from '../lib/github-stats.types'
import './GitHubActivity.css'

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: GitHubStats }

function dateLabel(value: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function activityLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count < 4) return 2
  if (count < 7) return 3
  return 4
}

function ActivityGrid({ data }: { data: GitHubStats }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const weeks = useMemo(() => {
    const lookup = new Map(data.days.map((day) => [day.date, day.count]))
    const first = new Date(`${data.range.start}T00:00:00Z`)
    first.setUTCDate(first.getUTCDate() - first.getUTCDay())
    const last = new Date(`${data.range.end}T00:00:00Z`)
    last.setUTCDate(last.getUTCDate() + 6 - last.getUTCDay())
    const result: { date: string; count: number; inRange: boolean }[][] = []

    for (const cursor = new Date(first); cursor <= last; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
      const week = []
      for (let offset = 0; offset < 7; offset++) {
        const day = new Date(cursor)
        day.setUTCDate(day.getUTCDate() + offset)
        const date = day.toISOString().slice(0, 10)
        week.push({ date, count: lookup.get(date) ?? 0, inRange: lookup.has(date) })
      }
      result.push(week)
    }
    return result
  }, [data])

  useEffect(() => {
    const element = scrollerRef.current
    if (element) element.scrollLeft = element.scrollWidth
  }, [weeks])

  const monthLabels = weeks.map((week, index) => {
    const firstDay = week.find((day) => day.inRange && day.date.endsWith('-01'))
    if (!firstDay) return null
    return <span key={firstDay.date} style={{ gridColumn: index + 1 }}>{new Date(`${firstDay.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>
  })

  return (
    <div className="github-activity__calendar" ref={scrollerRef}>
      <div className="github-activity__calendar-inner">
        <div className="github-activity__months" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }} aria-hidden="true">{monthLabels}</div>
        <div className="github-activity__graph-wrap">
          <div className="github-activity__weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
          <div className="github-activity__graph" role="img" aria-label={`${data.totalCommits} public default-branch commits between ${dateLabel(data.range.start)} and ${dateLabel(data.range.end)}`}>
            {weeks.map((week, index) => (
              <div className="github-activity__week" key={index} aria-hidden="true">
                {week.map((day) => (
                  <span
                    key={day.date}
                    className={`github-activity__day github-activity__day--${day.inRange ? activityLevel(day.count) : 'outside'}`}
                    title={day.inRange ? `${dateLabel(day.date)}: ${day.count} commit${day.count === 1 ? '' : 's'}` : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GitHubActivity() {
  const headingRef = useReveal()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/github-stats', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('GitHub activity request failed')
        return response.json() as Promise<GitHubStats>
      })
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [])

  const data = state.status === 'ready' ? state.data : null
  const maxLanguageCount = Math.max(1, ...(data?.languages.map((language) => language.count) ?? []))

  return (
    <section id="github-activity" className="section section--white github-activity" aria-labelledby="github-activity-title">
      <div className="container">
        <div ref={headingRef} className="reveal github-activity__heading">
          <div>
            <p className="section__eyebrow">GITHUB / PUBLIC WORK</p>
            <h2 id="github-activity-title" className="section__headline">In the making.</h2>
          </div>
          <a className="github-activity__profile" href="https://github.com/markmumba" target="_blank" rel="noopener noreferrer">View GitHub profile <span aria-hidden="true">↗</span></a>
        </div>

        {state.status === 'loading' && <p className="github-activity__status" role="status">Loading public GitHub activity...</p>}
        {state.status === 'error' && <p className="github-activity__status" role="status">GitHub activity is unavailable right now. <a href="https://github.com/markmumba" target="_blank" rel="noopener noreferrer">Browse my repositories ↗</a></p>}

        {data && <>
          <div className="github-activity__topline">
            <div className="github-activity__metric">
              <strong>{data.totalCommits.toLocaleString()}</strong>
              <span>public default-branch commits<br />in the past year{data.partial ? ' (partial)' : ''}</span>
            </div>
            <div className="github-activity__latest">
              <p className="github-activity__label">LATEST COMMIT</p>
              {data.latestCommit ? <>
                <a href={data.latestCommit.url} target="_blank" rel="noopener noreferrer" className="github-activity__commit">{data.latestCommit.message} <span aria-hidden="true">↗</span></a>
                <p className="github-activity__meta">{data.latestCommit.repo} <span aria-hidden="true">/</span> {data.latestCommit.sha} <span aria-hidden="true">/</span> {dateLabel(data.latestCommit.date)}</p>
              </> : <p className="github-activity__empty">No public commits in this period.</p>}
            </div>
          </div>

          <div className="github-activity__activity">
            <div className="github-activity__row-heading">
              <p className="github-activity__label">A YEAR IN COMMITS</p>
              <span>{dateLabel(data.range.start)} - {dateLabel(data.range.end)}</span>
            </div>
            <ActivityGrid data={data} />
            <div className="github-activity__graph-footer">
              <span>Public default-branch commits only</span>
              <div className="github-activity__legend" aria-label="Activity intensity from less to more"><span>Less</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} className={`github-activity__day github-activity__day--${level}`} />)}<span>More</span></div>
            </div>
          </div>

          <div className="github-activity__languages">
            <div>
              <p className="github-activity__label">LANGUAGES IN MOTION</p>
              <h3>What I've touched lately.</h3>
              <p>Languages found in files changed across {data.languageSampleSize} recent public commits. A commit can count toward more than one language.</p>
            </div>
            <div className="github-activity__language-list">
              {data.languages.length ? data.languages.map((language, index) => (
                <div className="github-activity__language" key={language.name}>
                  <span className="github-activity__language-index">0{index + 1}</span>
                  <span className="github-activity__language-name">{language.name}</span>
                  <span className="github-activity__language-track"><span style={{ width: `${(language.count / maxLanguageCount) * 100}%` }} /></span>
                  <span className="github-activity__language-count">{language.count}</span>
                </div>
              )) : <p className="github-activity__empty">No recognized code files in the recent sample.</p>}
            </div>
          </div>
          <p className="github-activity__updated">PUBLIC GITHUB DATA / UPDATED {dateLabel(data.fetchedAt)}</p>
        </>}
      </div>
    </section>
  )
}
