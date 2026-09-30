export interface GitHubStats {
  login: string
  fetchedAt: string
  range: { start: string; end: string }
  totalCommits: number
  partial: boolean
  days: { date: string; count: number }[]
  latestCommit: {
    message: string
    repo: string
    url: string
    date: string
    sha: string
  } | null
  languages: { name: string; count: number }[]
  languageSampleSize: number
}
