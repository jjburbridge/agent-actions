import {useQuery} from '@sanity/sdk-react'
import {Label, Select, Stack} from '@sanity/ui'

type MarketPickerProps = {
  value: string | null
  onChange: (marketId: string | null) => void
}

type MarketOption = {_id: string; title: string | null}

const MARKETS_QUERY = `*[_type == "market"]|order(title asc){_id, title}`

export function MarketPicker({value, onChange}: MarketPickerProps) {
  const {data, isPending} = useQuery<MarketOption[]>({query: MARKETS_QUERY})

  return (
    <Stack gap={2} style={{opacity: isPending ? 0.7 : 1}}>
      <Label size={1}>Market</Label>
      <Select
        value={value || ''}
        onChange={(event) => {
          const next = event.currentTarget.value
          onChange(next || null)
        }}
      >
        <option value="">Select a market…</option>
        {(data || []).map((market) => (
          <option key={market._id} value={market._id}>
            {market.title || 'Untitled'}
          </option>
        ))}
      </Select>
    </Stack>
  )
}
