import { createClient } from 'contentful'
import type { Asset } from 'contentful'
import { optimizeContentfulImageUrl } from './contentful-image'

const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
})

function getImageUrl(blogImage: Asset): string {
  try {
    if (blogImage && typeof blogImage === 'object' && 'fields' in blogImage) {
      const asset = blogImage as Asset
      if (asset.fields?.file && typeof asset.fields.file === 'object' && 'url' in asset.fields.file) {
        let url = String(asset.fields.file.url)
        url = url.startsWith('//') ? `https:${url}` : url
        return optimizeContentfulImageUrl(url)
      }
    }
    return ''
  } catch {
    return ''
  }
}

function getImageAlt(blogImage: Asset, fallbackTitle: string): string {
  try {
    if (blogImage && typeof blogImage === 'object' && 'fields' in blogImage) {
      const asset = blogImage as Asset
      const title = asset.fields?.title
      return typeof title === 'string' ? title : fallbackTitle
    }
    return fallbackTitle
  } catch {
    return fallbackTitle
  }
}

export interface EssayItem {
  id: string
  blogImage: string
  blogImageAlt: string
  blogImageOwner: unknown
  title: unknown
  article: unknown
  author: unknown
  publishDate: unknown
  category: unknown
  tags: string[]
  nugget: unknown
  nuggetAuthor: unknown
  sys: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(item: any): EssayItem {
  const rawTags = item.fields.tags
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((t) => t != null).map((t) => String(t))
    : typeof rawTags === 'string'
    ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
    : []
  return {
    id: String(item.fields.id),
    blogImage: getImageUrl(item.fields.blogImage as Asset),
    blogImageAlt: getImageAlt(item.fields.blogImage as Asset, String(item.fields.title ?? '')),
    blogImageOwner: item.fields.blogImageOwner,
    title: item.fields.title,
    article: item.fields.article,
    author: item.fields.author,
    publishDate: item.fields.publishDate,
    category: item.fields.category,
    tags,
    nugget: item.fields.nugget,
    nuggetAuthor: item.fields.nuggetAuthor,
    sys: item.sys,
  }
}

export async function getEssays(): Promise<EssayItem[]> {
  try {
    const response = await client.getEntries({
      content_type: 'articles',
      order: ['-fields.publishDate'],
    } as Parameters<typeof client.getEntries>[0])
    return response.items.map(mapItem)
  } catch (error) {
    console.error('Error fetching essays:', error)
    return []
  }
}

export async function getEssaysForHomepage(): Promise<EssayItem[]> {
  try {
    const response = await client.getEntries({
      content_type: 'articles',
      order: ['-fields.publishDate'],
      limit: 4,
    } as Parameters<typeof client.getEntries>[0])
    return response.items.map(mapItem)
  } catch (error) {
    console.error('Error fetching essays for homepage:', error)
    return []
  }
}

export async function getEssayById(id: string): Promise<EssayItem | null> {
  try {
    const response = await client.getEntries({
      content_type: 'articles',
      'fields.id': id,
      limit: 1,
    } as Parameters<typeof client.getEntries>[0])
    if (response.items.length === 0) return null
    return mapItem(response.items[0])
  } catch (error) {
    console.error('Error fetching essay by id:', error)
    return null
  }
}

export default client
