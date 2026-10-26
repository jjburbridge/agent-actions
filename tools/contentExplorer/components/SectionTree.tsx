import {useMemo} from 'react'
import {useQuery} from '@sanity/sdk-react'
import {Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {buildSectionTree} from '../lib/buildSectionTree'
import type {SectionFlat, SectionNode} from '../lib/types'

type SectionTreeProps = {
  productId: string
  marketId: string
  selectedSectionId: string | null
  onSelectSection: (sectionId: string) => void
}

const SECTIONS_QUERY = `*[_type == "section" && $productId in products[]._ref]{
  _id,
  title,
  "parentId": parent._ref,
  "hasContent": count(*[_type == "contentSection" && section._ref == ^._id && market._ref == $marketId]) > 0
}`

function TreeNode({
  node,
  depth,
  selectedSectionId,
  onSelectSection,
}: {
  node: SectionNode
  depth: number
  selectedSectionId: string | null
  onSelectSection: (sectionId: string) => void
}) {
  const selected = selectedSectionId === node._id

  return (
    <Stack gap={1}>
      <Card
        as="button"
        padding={2}
        radius={2}
        tone={selected ? 'primary' : node.hasContent ? 'positive' : 'caution'}
        selected={selected}
        onClick={() => onSelectSection(node._id)}
        style={{
          marginLeft: depth * 16,
          textAlign: 'left',
          cursor: 'pointer',
          width: `calc(100% - ${depth * 16}px)`,
          border: 'none',
          opacity: node.hasContent ? 1 : 0.85,
        }}
      >
        <Flex align="center" justify="space-between" gap={2}>
          <Text size={1} weight={selected ? 'semibold' : 'regular'} muted={!node.hasContent}>
            {node.title || 'Untitled section'}
          </Text>
          <Badge tone={node.hasContent ? 'positive' : 'caution'} fontSize={0}>
            {node.hasContent ? 'Has content' : 'Missing'}
          </Badge>
        </Flex>
      </Card>
      {node.children.map((child) => (
        <TreeNode
          key={child._id}
          node={child}
          depth={depth + 1}
          selectedSectionId={selectedSectionId}
          onSelectSection={onSelectSection}
        />
      ))}
    </Stack>
  )
}

export function SectionTree({
  productId,
  marketId,
  selectedSectionId,
  onSelectSection,
}: SectionTreeProps) {
  const {data, isPending} = useQuery<SectionFlat[]>({
    query: SECTIONS_QUERY,
    params: {productId, marketId},
  })

  const tree = useMemo(() => buildSectionTree(data || []), [data])

  const counts = useMemo(() => {
    const sections = data || []
    const withContent = sections.filter((section) => section.hasContent).length
    return {
      withContent,
      withoutContent: sections.length - withContent,
    }
  }, [data])

  if (!data?.length) {
    return (
      <Box padding={3}>
        <Text muted size={1}>
          No sections linked to this product.
        </Text>
      </Box>
    )
  }

  return (
    <Stack gap={3} style={{opacity: isPending ? 0.6 : 1}}>
      <Flex gap={2} wrap="wrap">
        <Badge tone="positive">{counts.withContent} with content</Badge>
        <Badge tone="caution">{counts.withoutContent} missing</Badge>
      </Flex>
      <Stack gap={2}>
        {tree.map((node) => (
          <TreeNode
            key={node._id}
            node={node}
            depth={0}
            selectedSectionId={selectedSectionId}
            onSelectSection={onSelectSection}
          />
        ))}
      </Stack>
    </Stack>
  )
}
