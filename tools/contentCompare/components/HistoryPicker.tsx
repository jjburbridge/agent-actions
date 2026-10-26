import {useQuery} from '@sanity/sdk-react'
import {Label, Select, Stack, Text} from '@sanity/ui'

export type ExportHistoryOption = {
  _id: string
  exportedAt: string | null
  productId: string | null
  marketId: string | null
  productTitle: string | null
  marketTitle: string | null
  fileUrl: string | null
}

type HistoryPickerProps = {
  value: string | null
  onChange: (history: ExportHistoryOption | null) => void
}

const HISTORY_QUERY = `*[_type == "exportHistory" && defined(file.asset)]|order(exportedAt desc){
  _id,
  exportedAt,
  "productId": product._ref,
  "marketId": market._ref,
  "productTitle": product->title,
  "marketTitle": market->title,
  "fileUrl": file.asset->url
}`

export function HistoryPicker({value, onChange}: HistoryPickerProps) {
  const {data, isPending} = useQuery<ExportHistoryOption[]>({query: HISTORY_QUERY})
  const options = data || []

  return (
    <Stack gap={2} style={{opacity: isPending ? 0.7 : 1}}>
      <Label size={1}>Export history</Label>
      <Select
        value={value || ''}
        onChange={(event) => {
          const nextId = event.currentTarget.value || null
          onChange(options.find((item) => item._id === nextId) || null)
        }}
      >
        <option value="">Select an export…</option>
        {options.map((item) => (
          <option key={item._id} value={item._id}>
            {(item.productTitle || 'Product') +
              ' · ' +
              (item.marketTitle || 'Market') +
              ' · ' +
              (item.exportedAt ? new Date(item.exportedAt).toLocaleString() : 'No date')}
          </option>
        ))}
      </Select>
      {!isPending && options.length === 0 && (
        <Text muted size={1}>
          No export history found. Export JSON from Content Explorer first.
        </Text>
      )}
    </Stack>
  )
}
