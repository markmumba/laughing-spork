import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { BLOCKS, MARKS, INLINES } from '@contentful/rich-text-types'
import type { Document, Block, Inline } from '@contentful/rich-text-types'
import React from 'react'
import CodeBlock from '../components/CodeBlock'

interface TextNode {
  nodeType: 'text'
  value: string
  marks?: Array<{ type: string }>
}

interface ContentNode {
  nodeType: string
  content?: TextNode[]
  data?: Record<string, unknown>
}

function isCodeParagraph(node: ContentNode): boolean {
  if (node.nodeType !== 'paragraph' || !node.content) return false
  return node.content.every(
    (child) => child.nodeType === 'text' && child.marks?.some((m) => m.type === 'code')
  )
}

function isEmptyParagraph(node: ContentNode): boolean {
  if (node.nodeType !== 'paragraph' || !node.content) return false
  return node.content.every((child) => child.nodeType === 'text' && child.value.trim() === '')
}

function getCodeText(node: ContentNode): string {
  return node.content?.map((c) => c.value).join('') || ''
}

function mergeCodeBlocks(doc: Document): Document {
  const merged: ContentNode[] = []
  const nodes = doc.content as ContentNode[]
  let i = 0
  while (i < nodes.length) {
    if (isCodeParagraph(nodes[i])) {
      const lines: string[] = [getCodeText(nodes[i])]
      let j = i + 1
      while (j < nodes.length) {
        if (isCodeParagraph(nodes[j])) {
          lines.push(getCodeText(nodes[j]))
          j++
        } else if (isEmptyParagraph(nodes[j]) && j + 1 < nodes.length && isCodeParagraph(nodes[j + 1])) {
          lines.push('')
          j++
        } else {
          break
        }
      }
      merged.push({
        nodeType: 'paragraph',
        content: [{ nodeType: 'text', value: lines.join('\n'), marks: [{ type: 'code' }] }],
        data: {},
      })
      i = j
    } else {
      merged.push(nodes[i])
      i++
    }
  }
  return { ...doc, content: merged } as Document
}

type ParagraphNode = { content?: TextNode[] }

const options = {
  renderMark: {
    [MARKS.BOLD]: (text: React.ReactNode) => <strong>{text}</strong>,
    [MARKS.ITALIC]: (text: React.ReactNode) => <em>{text}</em>,
    [MARKS.UNDERLINE]: (text: React.ReactNode) => <u>{text}</u>,
    [MARKS.CODE]: (text: React.ReactNode) => <code>{text}</code>,
    [MARKS.STRIKETHROUGH]: (text: React.ReactNode) => <del>{text}</del>,
    [MARKS.SUPERSCRIPT]: (text: React.ReactNode) => <sup>{text}</sup>,
    [MARKS.SUBSCRIPT]: (text: React.ReactNode) => <sub>{text}</sub>,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: Block | Inline, children: React.ReactNode) => {
      const p = node as ParagraphNode
      const isCodeBlock = p.content?.every(
        (c) => c.nodeType === 'text' && c.marks?.some((m) => m.type === 'code')
      )
      if (isCodeBlock) {
        const code = p.content?.map((c) => c.value).join('') || ''
        return (
          <div className="code-block-wrapper">
            <pre>
              <CodeBlock code={code} />
            </pre>
          </div>
        )
      }
      return <p>{children}</p>
    },
    [BLOCKS.HEADING_1]: (_: Block | Inline, children: React.ReactNode) => <h1>{children}</h1>,
    [BLOCKS.HEADING_2]: (_: Block | Inline, children: React.ReactNode) => <h2>{children}</h2>,
    [BLOCKS.HEADING_3]: (_: Block | Inline, children: React.ReactNode) => <h3>{children}</h3>,
    [BLOCKS.HEADING_4]: (_: Block | Inline, children: React.ReactNode) => <h4>{children}</h4>,
    [BLOCKS.HEADING_5]: (_: Block | Inline, children: React.ReactNode) => <h5>{children}</h5>,
    [BLOCKS.HEADING_6]: (_: Block | Inline, children: React.ReactNode) => <h6>{children}</h6>,
    [BLOCKS.UL_LIST]: (_: Block | Inline, children: React.ReactNode) => <ul>{children}</ul>,
    [BLOCKS.OL_LIST]: (_: Block | Inline, children: React.ReactNode) => <ol>{children}</ol>,
    [BLOCKS.LIST_ITEM]: (_: Block | Inline, children: React.ReactNode) => <li>{children}</li>,
    [BLOCKS.QUOTE]: (_: Block | Inline, children: React.ReactNode) => (
      <blockquote>{children}</blockquote>
    ),
    [BLOCKS.HR]: () => (
      <div className="article-hr">
        <span />
        <span />
        <span />
      </div>
    ),
    [BLOCKS.TABLE]: (_: Block | Inline, children: React.ReactNode) => (
      <div className="article-table-wrap">
        <table>
          <tbody>{children}</tbody>
        </table>
      </div>
    ),
    [BLOCKS.TABLE_ROW]: (_: Block | Inline, children: React.ReactNode) => <tr>{children}</tr>,
    [BLOCKS.TABLE_CELL]: (_: Block | Inline, children: React.ReactNode) => <td>{children}</td>,
    [BLOCKS.TABLE_HEADER_CELL]: (_: Block | Inline, children: React.ReactNode) => (
      <th>{children}</th>
    ),
    [INLINES.HYPERLINK]: (node: Block | Inline, children: React.ReactNode) => (
      <a
        href={(node as { data?: { uri?: string } }).data?.uri}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    [INLINES.ENTRY_HYPERLINK]: (node: Block | Inline, children: React.ReactNode) => (
      <a href={`/essays/${(node as { data?: { target?: { sys?: { id?: string } } } }).data?.target?.sys?.id}`}>
        {children}
      </a>
    ),
    [INLINES.ASSET_HYPERLINK]: (node: Block | Inline, children: React.ReactNode) => (
      <a
        href={(node as { data?: { target?: { fields?: { file?: { url?: string } } } } }).data?.target?.fields?.file?.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => {
      const { title, description, file } = (
        node as { data?: { target?: { fields?: { title?: string; description?: string; file?: { url?: string } } } } }
      ).data?.target?.fields || {}
      const rawUrl = file?.url || ''
      const src = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl
      return (
        <figure>
          <img src={src} alt={description || title || ''} loading="lazy" decoding="async" />
          {title && <figcaption>{title}</figcaption>}
        </figure>
      )
    },
    [BLOCKS.EMBEDDED_ENTRY]: (node: Block | Inline) => {
      const entryType = (
        node as { data?: { target?: { sys?: { contentType?: { sys?: { id?: string } } } } } }
      ).data?.target?.sys?.contentType?.sys?.id
      const entryTitle = (
        node as { data?: { target?: { fields?: { title?: string } } } }
      ).data?.target?.fields?.title
      return (
        <div className="article-embedded-entry">
          <p>{entryType}: {entryTitle || 'Untitled'}</p>
        </div>
      )
    },
  },
}

export default function RichTextRenderer({ content }: { content: Document | null }) {
  if (!content) return <p style={{ color: '#6e6e73', fontStyle: 'italic' }}>No content available.</p>
  const processed = mergeCodeBlocks(content)
  return <>{documentToReactComponents(processed, options)}</>
}
