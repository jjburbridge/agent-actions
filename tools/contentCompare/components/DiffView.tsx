import {Badge, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import type {ContentChange, DocumentChangeSummary, SectionDiff} from '../lib/createDiff'
import {DocumentChangeDiff} from './DocumentChangeDiff'

type DiffViewProps = {
  sections: SectionDiff[]
  summary: DocumentChangeSummary
}

const KIND_TONE = {
  added: 'positive',
  removed: 'critical',
  changed: 'caution',
} as const

const KIND_LABEL = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
} as const

export function DiffView({sections, summary}: DiffViewProps) {
  const hasChanges = summary.added + summary.removed + summary.changed > 0

  return (
    <Stack gap={4}>
      <Flex gap={2} wrap="wrap">
        <Badge tone="positive">{summary.added} added</Badge>
        <Badge tone="critical">{summary.removed} removed</Badge>
        <Badge tone="caution">{summary.changed} changed</Badge>
        <Badge tone="default">{summary.unchanged} unchanged</Badge>
      </Flex>

      {!hasChanges ? (
        <Card padding={4} radius={2} border tone="positive">
          <Text size={1}>No differences between the export and current data.</Text>
        </Card>
      ) : (
        <Stack gap={5}>
          {sections.map((section) => (
            <SectionDiffCard key={section.sectionId} section={section} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function SectionDiffCard({section}: {section: SectionDiff}) {
  return (
    <Card padding={4} radius={2} border>
      <Stack gap={4}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Heading as="h3" size={1}>
            {section.sectionTitle}
          </Heading>
          <Badge tone="caution">
            {section.changes.length} change{section.changes.length === 1 ? '' : 's'}
          </Badge>
        </Flex>

        <Stack gap={4}>
          {section.changes.map((change) => (
            <ContentChangeCard key={change.id} change={change} />
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

function ContentChangeCard({change}: {change: ContentChange}) {
  const before = change.kind === 'added' ? null : change.before
  const after = change.kind === 'removed' ? null : change.after

  return (
    <Card padding={4} radius={2} border tone={KIND_TONE[change.kind]}>
      <Stack gap={3}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Text weight="semibold" size={1}>
            {change.title}
          </Text>
          <Badge tone={KIND_TONE[change.kind]}>{KIND_LABEL[change.kind]}</Badge>
        </Flex>

        <DocumentChangeDiff before={before} after={after} />
      </Stack>
    </Card>
  )
}
