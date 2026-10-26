import {Suspense, useState} from 'react'
import {Box, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {ComparePanel} from './components/ComparePanel'
import {HistoryPicker, type ExportHistoryOption} from './components/HistoryPicker'

function PanelFallback() {
  return (
    <Flex align="center" justify="center" padding={5}>
      <Spinner muted />
    </Flex>
  )
}

export function ContentCompare() {
  const [history, setHistory] = useState<ExportHistoryOption | null>(null)

  return (
    <Box padding={4} height="fill" overflow="auto">
      <Stack gap={4}>
        <Stack gap={2}>
          <Heading as="h1" size={2}>
            Content compare
          </Heading>
          <Text muted size={1}>
            Compare an export history JSON file with the current product and market content.
          </Text>
        </Stack>

        <Suspense fallback={<PanelFallback />}>
          <HistoryPicker value={history?._id || null} onChange={setHistory} />
        </Suspense>

        {!history ? (
          <Card padding={5} radius={2} border tone="transparent">
            <Text muted>Select an export history entry to view the diff.</Text>
          </Card>
        ) : (
          <Suspense key={history._id} fallback={<PanelFallback />}>
            <ComparePanel history={history} />
          </Suspense>
        )}
      </Stack>
    </Box>
  )
}
