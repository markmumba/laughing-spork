import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const output = mkdtempSync(join(tmpdir(), 'portfolio-github-'))
const originalFetch = globalThis.fetch
try {
  execFileSync('node_modules/.bin/tsc', [
    '--ignoreConfig', 'api/github-stats.ts', '--outDir', output, '--module', 'NodeNext',
    '--moduleResolution', 'NodeNext', '--target', 'ES2023', '--skipLibCheck',
  ], { stdio: 'inherit' })
  writeFileSync(join(output, 'package.json'), '{"type":"module"}')
  const { default: handler } = await import(pathToFileURL(join(output, 'api/github-stats.js')))
  globalThis.fetch = async () => Response.json({ total_count: 0, incomplete_results: false, items: [] })
  const response = await handler.fetch()
  assert.equal(response.status, 200)
  const stats = await response.json()
  assert.equal(stats.login, 'markmumba')
  assert.ok(stats.days.length >= 365)
  assert.equal(stats.totalCommits, 0)
  assert.match(response.headers.get('Cache-Control'), /s-maxage=21600/)
  console.log('PASS: compiled ESM function starts and returns GitHub stats JSON')
} finally {
  globalThis.fetch = originalFetch
  rmSync(output, { recursive: true, force: true })
}
