import { useEffect, useMemo, useRef, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import go from 'highlight.js/lib/languages/go'
import kotlin from 'highlight.js/lib/languages/kotlin'
import yaml from 'highlight.js/lib/languages/yaml'
import css from 'highlight.js/lib/languages/css'

hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('go', go)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('css', css)

// Names shown in the corner label; highlight.js ids that read oddly get a friendlier name
const LANGUAGE_NAMES: Record<string, string> = { xml: 'html', bash: 'shell' }

// Contentful doesn't record a snippet's language, so the label comes from highlight.js's
// guess. Java, Kotlin, TypeScript and JavaScript look too alike to tell apart reliably (Java
// snippets come back as "ts"), so only these distinctive languages are labelled, and only
// when the guess is confident. Anything else is left unlabelled rather than mislabelled.
const LABELLED = new Set(['yaml', 'json', 'sql', 'bash', 'xml', 'css', 'python', 'go'])
const MIN_RELEVANCE = 8

// Quiet code panel in the reading column: greyscale highlighting (ArticlePage.css),
// a small language label, and a Copy button that appears on hover or focus
export default function CodeBlock({ code }: { code: string }) {
  const blockRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const { html, language } = useMemo(() => {
    const result = hljs.highlightAuto(code)
    const id = result.language && LABELLED.has(result.language) && result.relevance >= MIN_RELEVANCE ? result.language : undefined
    return { html: result.value, language: id ? LANGUAGE_NAMES[id] ?? id : null }
  }, [code])

  // Fade the right edge only while there is more code to scroll to
  useEffect(() => {
    const pre = preRef.current
    const block = blockRef.current
    if (!pre || !block) return
    const update = () => {
      block.classList.toggle('has-more', pre.scrollLeft + pre.clientWidth < pre.scrollWidth - 2)
    }
    update()
    pre.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(pre)
    return () => {
      pre.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [html])

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div ref={blockRef} className={`code-block${language ? ' has-label' : ''}`}>
      {language && <span className="code-block__lang">{language}</span>}
      <button type="button" className="code-block__copy" onClick={copy} aria-live="polite">
        {copied ? 'Copied' : 'Copy'}
      </button>
      {/* highlight.js escapes the source, so its markup is safe to insert */}
      <pre ref={preRef}><code className="hljs" dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </div>
  )
}
