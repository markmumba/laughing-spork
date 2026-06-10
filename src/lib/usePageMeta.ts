import { useEffect } from 'react'

interface PageMeta {
  title: string
  description?: string
  image?: string
}

const BASE_TITLE = 'Markian Mumba — Engineer, Learner, Philosopher'
const BASE_DESC = 'Fullstack Developer building distributed systems and clean abstractions in Nairobi, Kenya.'

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('="')
    el.setAttribute(attrName, attrVal.replace('"', ''))
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

export function usePageMeta({ title, description, image }: PageMeta) {
  useEffect(() => {
    const fullTitle = title === BASE_TITLE ? title : `${title} — Markian Mumba`
    const desc = description ?? BASE_DESC

    document.title = fullTitle

    setMeta('meta[property="og:title"]', 'content', fullTitle)
    setMeta('meta[name="twitter:title"]', 'content', fullTitle)
    setMeta('meta[name="description"]', 'content', desc)
    setMeta('meta[property="og:description"]', 'content', desc)
    setMeta('meta[name="twitter:description"]', 'content', desc)

    if (image) {
      setMeta('meta[property="og:image"]', 'content', image)
      setMeta('meta[name="twitter:image"]', 'content', image)
    }

    return () => {
      document.title = BASE_TITLE
      setMeta('meta[property="og:title"]', 'content', BASE_TITLE)
      setMeta('meta[name="twitter:title"]', 'content', BASE_TITLE)
      setMeta('meta[name="description"]', 'content', BASE_DESC)
      setMeta('meta[property="og:description"]', 'content', BASE_DESC)
      setMeta('meta[name="twitter:description"]', 'content', BASE_DESC)
    }
  }, [title, description, image])
}
