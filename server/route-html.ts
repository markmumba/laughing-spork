import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { contentfulSrcSet, optimizeContentfulImageUrl } from '../src/lib/contentful-image'

// Route-specific HTML shells, written after the build.
//
// Every route used to share dist/index.html. This plugin splits it into:
//   - dist/app.html          untouched shell, the SPA fallback for every other route
//   - dist/index.html        homepage: preloads the hero's first visible card image
//   - dist/essays/index.html essays index: essay list snapshot + featured image preload
// vercel.json routes /essays and the catch-all explicitly; "/" is served from index.html.
//
// Homepage: the hero image is created by React, so without a preload the browser only finds
// it after the JS chain runs (about 2.4s of the 5.1s LCP on the live site).
//
// Essays: the SPA can only learn which image is the featured essay after the Contentful API answers,
// so that image (the page's LCP) starts late. This plugin fetches the essay list during the
// build and writes dist/essays/index.html: the normal app shell plus
//   - a <link rel="preload"> for the featured image, discoverable while the HTML parses, and
//   - the list itself as JSON, so the page renders without waiting for the API.
// Vercel serves real files before applying the catch-all rewrite, so /essays gets this file.
// The page still refetches from Contentful after rendering, so posts published since the last
// build appear too.

// Must match the card centered on first paint in src/components/Hero.tsx (cards[1])
const HOME_HERO_IMAGE = '/projects/foliocuts.webp'

// Must match the featured image in src/pages/EssaysPage.tsx, or the preload is wasted
const FEATURED_IMAGE = { width: 800, quality: 70, srcSetWidths: [500, 800, 1000], srcSetQuality: 60, sizes: '(max-width: 900px) 100vw, 610px' }
const EXCERPT_CHARS = 400

type Link = { sys: { id: string } }
type Entry = { sys: { id: string }; fields: Record<string, unknown> }
type Asset = { sys: { id: string }; fields: { title?: string; file?: { url?: string } } }

function richTextToPlain(rich: unknown): string {
  const parts: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { value?: unknown; content?: unknown[] }
    if (typeof n.value === 'string') parts.push(n.value)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  const root = rich as { content?: unknown[] } | null
  if (root && Array.isArray(root.content)) root.content.forEach(walk)
  return parts.join(' ')
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((t) => t != null).map(String)
  if (typeof raw === 'string') return raw.split(',').map((t) => t.trim()).filter(Boolean)
  return []
}

async function fetchEssays(space: string, token: string) {
  const url = new URL(`https://cdn.contentful.com/spaces/${space}/environments/master/entries`)
  url.searchParams.set('content_type', 'articles')
  url.searchParams.set('order', '-fields.publishDate')
  url.searchParams.set('include', '1')
  url.searchParams.set('limit', '200')
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`Contentful responded ${response.status}`)
  const data = await response.json() as { items: Entry[]; includes?: { Asset?: Asset[] } }
  const assets = new Map((data.includes?.Asset ?? []).map((asset) => [asset.sys.id, asset]))

  // Same shape as EssayItem in src/lib/contentful.ts, with the article body replaced by `summary`
  return data.items.map((item) => {
    const asset = assets.get((item.fields.blogImage as Link | undefined)?.sys.id ?? '')
    const rawUrl = asset?.fields.file?.url ?? ''
    const plain = richTextToPlain(item.fields.article).trim()
    return {
      id: String(item.fields.id),
      blogImage: rawUrl ? optimizeContentfulImageUrl(rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl) : '',
      blogImageAlt: typeof asset?.fields.title === 'string' ? asset.fields.title : String(item.fields.title ?? ''),
      title: item.fields.title,
      author: item.fields.author,
      publishDate: item.fields.publishDate,
      category: item.fields.category,
      tags: parseTags(item.fields.tags),
      article: null,
      summary: { words: plain.split(/\s+/).filter(Boolean).length, text: plain.slice(0, EXCERPT_CHARS) },
    }
  })
}

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

async function writeEssaysShell(config: ResolvedConfig, outDir: string, shell: string) {
  const space = config.env.VITE_CONTENTFUL_SPACE_ID
  const token = config.env.VITE_CONTENTFUL_ACCESS_TOKEN
  if (!space || !token) {
    config.logger.warn('[route-html] Contentful env vars missing; /essays will load client-side only.')
    return
  }

  let essays: Awaited<ReturnType<typeof fetchEssays>>
  try {
    essays = await fetchEssays(space, token)
  } catch (error) {
    config.logger.warn(`[route-html] Essays snapshot skipped: ${(error as Error).message}`)
    return
  }

  const title = 'Writing — Markian Mumba Mwangi'
  const description = 'Thoughts and ideas on distributed systems, engineering craft, and software philosophy.'
  let html = shell
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, '$1https://markian.fit/essays$2')

  const featured = essays[0]?.blogImage
  const preload = featured
    ? `<link rel="preload" as="image" fetchpriority="high" href="${escapeAttr(optimizeContentfulImageUrl(featured, { width: FEATURED_IMAGE.width, quality: FEATURED_IMAGE.quality }))}" imagesrcset="${escapeAttr(contentfulSrcSet(featured, FEATURED_IMAGE.srcSetWidths, FEATURED_IMAGE.srcSetQuality))}" imagesizes="${FEATURED_IMAGE.sizes}" />\n    `
    : ''
  // Escape "<" so essay text can never close the script tag early
  const json = JSON.stringify(essays).replace(/</g, '\\u003c')
  html = html
    .replace('</head>', `  ${preload}</head>`)
    .replace('</body>', `  <script id="essays-snapshot" type="application/json">${json}</script>\n  </body>`)

  await mkdir(path.join(outDir, 'essays'), { recursive: true })
  await writeFile(path.join(outDir, 'essays', 'index.html'), html)
  config.logger.info(`[route-html] Wrote essays/index.html with ${essays.length} essays.`)
}

export function routeHtml(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'route-html',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    // One hook does all three files in order: closeBundle hooks of separate plugins run in parallel
    async closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir)
      const shell = await readFile(path.join(outDir, 'index.html'), 'utf8')

      await writeFile(path.join(outDir, 'app.html'), shell)
      await writeEssaysShell(config, outDir, shell)

      const home = shell.replace('</head>', `  <link rel="preload" as="image" fetchpriority="high" href="${HOME_HERO_IMAGE}" />\n  </head>`)
      await writeFile(path.join(outDir, 'index.html'), home)
      config.logger.info('[route-html] Wrote app.html and the homepage preload.')
    },
  }
}
