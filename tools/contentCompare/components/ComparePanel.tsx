import {useEffect, useMemo, useState} from 'react'
import {useQuery} from '@sanity/sdk-react'
import {Card, Heading, Spinner, Stack, Text} from '@sanity/ui'
import type {ContentSectionDoc} from '../../contentExplorer/lib/types'
import {createSectionDiffs} from '../lib/createDiff'
import {normalizeExportData} from '../lib/normalizeExport'
import type {ExportHistoryOption} from './HistoryPicker'
import {DiffView} from './DiffView'

type ComparePanelProps = {
  history: ExportHistoryOption
}

const CURRENT_CONTENT_QUERY = `*[_type == "contentSection" && market._ref == $marketId && $productId in section->products[]._ref]|order(section->title asc, title asc){
  _id,
  title,
  content,
  "sectionId": section._ref,
  "sectionTitle": section->title
}`

export function ComparePanel({history}: ComparePanelProps) {
  const productId = history.productId || ''
  const marketId = history.marketId || ''

  const {data: currentData, isPending} = useQuery<ContentSectionDoc[]>({
    query: CURRENT_CONTENT_QUERY,
    params: {productId, marketId},
  })

  const [exportedData, setExportedData] = useState<ContentSectionDoc[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingFile, setIsLoadingFile] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadExportFile() {
      if (!history.fileUrl) {
        setLoadError('Selected export has no file URL')
        setExportedData(null)
        return
      }

      setIsLoadingFile(true)
      setLoadError(null)

      try {
        const response = await fetch(history.fileUrl)
        if (!response.ok) {
          throw new Error(`Failed to download export file (${response.status})`)
        }
        const json = await response.json()
        if (!cancelled) {
          setExportedData(normalizeExportData(json))
        }
      } catch (err) {
        if (!cancelled) {
          setExportedData(null)
          setLoadError(err instanceof Error ? err.message : 'Failed to load export file')
        }
      } finally {
        if (!cancelled) setIsLoadingFile(false)
      }
    }

    loadExportFile()
    return () => {
      cancelled = true
    }
  }, [history.fileUrl, history._id])

  const current = useMemo(() => normalizeExportData(currentData || []), [currentData])

  const {sections, summary} = useMemo(() => {
    if (!exportedData) {
      return {
        sections: [],
        summary: {added: 0, removed: 0, changed: 0, unchanged: 0},
      }
    }
    return createSectionDiffs(exportedData, current)
  }, [exportedData, current])

  if (!productId || !marketId) {
    return (
      <Card padding={4} radius={2} border tone="caution">
        <Text size={1}>This export is missing product or market references.</Text>
      </Card>
    )
  }

  if (isLoadingFile || isPending || !exportedData) {
    return (
      <Stack gap={3}>
        {(isLoadingFile || isPending) && <Spinner muted />}
        {loadError && (
          <Card padding={4} radius={2} border tone="critical">
            <Text size={1}>{loadError}</Text>
          </Card>
        )}
        {!loadError && (isLoadingFile || isPending) && (
          <Text muted size={1}>
            Loading export file and current content…
          </Text>
        )}
      </Stack>
    )
  }

  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Heading as="h2" size={1}>
          Section content
        </Heading>
        <Text muted size={1}>
          Export from {history.exportedAt ? new Date(history.exportedAt).toLocaleString() : 'unknown date'}{' '}
          compared with current {history.productTitle || 'product'} / {history.marketTitle || 'market'}{' '}
          content. Each section shows its full content with Studio DiffString highlights in place.
        </Text>
      </Stack>
      <DiffView sections={sections} summary={summary} />
    </Stack>
  )
}
