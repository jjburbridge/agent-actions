import {PortableText, type PortableTextComponents} from '@portabletext/react'
import type {PortableTextBlock} from '@portabletext/types'
import {Stack, Text} from '@sanity/ui'
import {normalizeContentValue} from '../lib/portableText'

const components: PortableTextComponents = {
  block: {
    normal: ({children}) => (
      <Text as="p" size={1} style={{margin: 0}}>
        {children}
      </Text>
    ),
    h1: ({children}) => (
      <Text as="h1" size={3} weight="semibold" style={{margin: 0}}>
        {children}
      </Text>
    ),
    h2: ({children}) => (
      <Text as="h2" size={2} weight="semibold" style={{margin: 0}}>
        {children}
      </Text>
    ),
    h3: ({children}) => (
      <Text as="h3" size={1} weight="semibold" style={{margin: 0}}>
        {children}
      </Text>
    ),
    blockquote: ({children}) => (
      <Text as="blockquote" size={1} muted style={{margin: 0, borderLeft: '3px solid', paddingLeft: 12}}>
        {children}
      </Text>
    ),
  },
  list: {
    bullet: ({children}) => (
      <Stack as="ul" gap={2} style={{margin: 0, paddingLeft: 20}}>
        {children}
      </Stack>
    ),
    number: ({children}) => (
      <Stack as="ol" gap={2} style={{margin: 0, paddingLeft: 20}}>
        {children}
      </Stack>
    ),
  },
  listItem: {
    bullet: ({children}) => (
      <Text as="li" size={1}>
        {children}
      </Text>
    ),
    number: ({children}) => (
      <Text as="li" size={1}>
        {children}
      </Text>
    ),
  },
  marks: {
    strong: ({children}) => <strong>{children}</strong>,
    em: ({children}) => <em>{children}</em>,
    code: ({children}) => <code>{children}</code>,
    underline: ({children}) => <span style={{textDecoration: 'underline'}}>{children}</span>,
    'strike-through': ({children}) => <s>{children}</s>,
  },
}

type PortableTextContentProps = {
  value: unknown
}

export function PortableTextContent({value}: PortableTextContentProps) {
  const blocks = normalizeContentValue(value) as PortableTextBlock[]

  if (!blocks.length || portableTextIsEmpty(blocks)) {
    return (
      <Text size={1} muted>
        —
      </Text>
    )
  }

  return (
    <Stack gap={3}>
      <PortableText value={blocks} components={components} />
    </Stack>
  )
}

function portableTextIsEmpty(blocks: PortableTextBlock[]) {
  return blocks.every((block) => {
    if (block._type !== 'block' || !('children' in block) || !Array.isArray(block.children)) {
      return false
    }
    return block.children.every(
      (child) => child._type !== 'span' || !('text' in child) || !child.text,
    )
  })
}
