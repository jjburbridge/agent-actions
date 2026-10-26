import {useState} from 'react'
import {useQuery} from '@sanity/sdk-react'
import {Button, Flex, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {saveExportHistory} from '../lib/exportJson'
import {downloadContentPdf} from '../lib/exportPdf'
import type {ContentSectionDoc} from '../lib/types'

type ExportActionsProps = {
  productId: string
  marketId: string
}

const ALL_CONTENT_QUERY = `*[_type == "contentSection" && market._ref == $marketId && $productId in section->products[]._ref]|order(section->title asc, title asc){
  _id,
  title,
  content,
  "sectionId": section._ref,
  "sectionTitle": section->title
}`

export function ExportActions({productId, marketId}: ExportActionsProps) {
  const client = useClient({apiVersion: '2025-08-15'})
  const {data, isPending} = useQuery<ContentSectionDoc[]>({
    query: ALL_CONTENT_QUERY,
    params: {productId, marketId},
  })
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = data || []
  const filename = `content-${productId}-${marketId}`
  const disabled = isPending || isExporting || items.length === 0

  async function handleExportJson() {
    setError(null)
    setIsExporting(true)

    try {
      await saveExportHistory({
        client,
        productId,
        marketId,
        filename,
        data: items,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export JSON')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Flex gap={2} align="center" wrap="wrap">
      <Button
        text={isPending ? 'Loading…' : 'Build PDF'}
        tone="primary"
        mode="ghost"
        disabled={disabled}
        onClick={() => downloadContentPdf(filename, items)}
      />
      <Button
        text={isExporting ? 'Saving…' : isPending ? 'Loading…' : `Export JSON (${items.length})`}
        tone="primary"
        mode="ghost"
        disabled={disabled}
        onClick={handleExportJson}
      />
      {error && (
        <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}}>
          {error}
        </Text>
      )}
    </Flex>
  )
}
