import { getGitHubStats } from '../server/github-stats.js'

export default {
  async fetch(): Promise<Response> {
    try {
      const stats = await getGitHubStats()
      return Response.json(stats, {
        headers: { 'Cache-Control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400' },
      })
    } catch (error) {
      console.error('GitHub stats request failed:', error)
      return Response.json({ error: 'GitHub activity is unavailable right now.' }, { status: 503 })
    }
  },
}
