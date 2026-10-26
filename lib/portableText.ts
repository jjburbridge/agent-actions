import type {PortableTextBlock} from '@portabletext/types'

function createKey() {
  return Math.random().toString(36).slice(2, 10)
}

export function isPortableText(value: unknown): value is PortableTextBlock[] {
  return Array.isArray(value) && (value.length === 0 || value.some((block) => block?._type === 'block'))
}

export function textToPortableText(text: string): PortableTextBlock[] {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return [
      {
        _type: 'block',
        _key: createKey(),
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: createKey(), text: '', marks: []}],
      },
    ]
  }

  return paragraphs.map((paragraph) => ({
    _type: 'block',
    _key: createKey(),
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: createKey(), text: paragraph, marks: []}],
  }))
}

export function portableTextToPlainText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''

  return value
    .map((block) => {
      if (!block || typeof block !== 'object') return ''
      if (block._type !== 'block' || !Array.isArray(block.children)) return ''
      return block.children
        .map((child: {_type?: string; text?: string}) =>
          child?._type === 'span' ? child.text || '' : '',
        )
        .join('')
    })
    .filter(Boolean)
    .join('\n\n')
}

export function normalizeContentValue(value: unknown): PortableTextBlock[] {
  if (typeof value === 'string') return textToPortableText(value)
  if (isPortableText(value)) return value
  return textToPortableText('')
}
