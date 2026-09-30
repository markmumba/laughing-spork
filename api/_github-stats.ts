import type { GitHubStats } from '../src/lib/github-stats.types'

const LOGIN = 'markmumba'
const API = 'https://api.github.com'
const CACHE_MS = 6 * 60 * 60 * 1000
const MAX_PAGES = 5
const LANGUAGE_SAMPLE = 20

interface SearchCommit {
  sha: string
  html_url: string
  commit: { message: string; committer: { date: string } }
  repository: { full_name: string; private: boolean }
}

interface SearchResponse {
  total_count: number
  incomplete_results: boolean
  items: SearchCommit[]
}

interface CommitDetail {
  files?: { filename: string }[]
}

let cached: { value: GitHubStats; expires: number } | undefined
let pending: Promise<GitHubStats> | undefined

async function githubJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'markian-portfolio',
    },
    signal: AbortSignal.timeout(12000),
  })

  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)
  return response.json() as Promise<T>
}

function languageFor(filename: string): string | null {
  if (/(^|\/)(node_modules|vendor|dist|build|\.next|generated)(\/|$)/i.test(filename) ||
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|go\.sum)$/.test(filename)) return null

  const extension = filename.split('.').pop()?.toLowerCase()
  const languages: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
    mjs: 'JavaScript', cjs: 'JavaScript', java: 'Java', py: 'Python',
    go: 'Go', rs: 'Rust', kt: 'Kotlin', kts: 'Kotlin',
    css: 'CSS', scss: 'CSS', html: 'HTML', sql: 'SQL',
    sh: 'Shell', bash: 'Shell', swift: 'Swift', rb: 'Ruby',
    php: 'PHP', c: 'C', cpp: 'C++', h: 'C++', cs: 'C#',
  }
  return extension ? languages[extension] ?? null : null
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function loadStats(): Promise<GitHubStats> {
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const start = new Date(end)
  start.setUTCFullYear(start.getUTCFullYear() - 1)
  start.setUTCDate(start.getUTCDate() + 1)

  const query = encodeURIComponent(`author:${LOGIN} committer-date:>=${dateKey(start)}`)
  const commits: SearchCommit[] = []
  let total = 0
  let incomplete = false

  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await githubJson<SearchResponse>(
      `/search/commits?q=${query}&sort=committer-date&order=desc&per_page=100&page=${page}`,
    )
    total = result.total_count
    incomplete ||= result.incomplete_results
    commits.push(...result.items.filter((item) => !item.repository.private))
    if (page * 100 >= total || result.items.length === 0) break
  }

  const counts = new Map<string, number>()
  for (const commit of commits) {
    const date = commit.commit.committer.date.slice(0, 10)
    if (date >= dateKey(start) && date <= dateKey(end)) {
      counts.set(date, (counts.get(date) ?? 0) + 1)
    }
  }

  const days: GitHubStats['days'] = []
  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    const key = dateKey(date)
    days.push({ date: key, count: counts.get(key) ?? 0 })
  }

  const recent = commits.slice(0, LANGUAGE_SAMPLE)
  const details = await Promise.allSettled(recent.map((commit) =>
    githubJson<CommitDetail>(`/repos/${commit.repository.full_name}/commits/${commit.sha}`),
  ))
  const languageCounts = new Map<string, number>()
  let languageSampleSize = 0
  for (const result of details) {
    if (result.status !== 'fulfilled') continue
    languageSampleSize++
    const touched = new Set(result.value.files?.map((file) => languageFor(file.filename)).filter((name) => name !== null))
    for (const name of touched) languageCounts.set(name, (languageCounts.get(name) ?? 0) + 1)
  }

  const latest = commits[0]
  return {
    login: LOGIN,
    fetchedAt: now.toISOString(),
    range: { start: dateKey(start), end: dateKey(end) },
    totalCommits: days.reduce((sum, day) => sum + day.count, 0),
    partial: incomplete || total > MAX_PAGES * 100 || commits.length < Math.min(total, MAX_PAGES * 100),
    days,
    latestCommit: latest ? {
      message: latest.commit.message.split('\n')[0],
      repo: latest.repository.full_name,
      url: latest.html_url,
      date: latest.commit.committer.date,
      sha: latest.sha.slice(0, 7),
    } : null,
    languages: [...languageCounts].map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 5),
    languageSampleSize,
  }
}

export function getGitHubStats(): Promise<GitHubStats> {
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value)
  if (pending) return pending

  pending = loadStats().then((value) => {
    cached = { value, expires: Date.now() + CACHE_MS }
    return value
  }).finally(() => { pending = undefined })
  return pending
}
