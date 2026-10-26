import {useQuery} from '@sanity/sdk-react'
import {Label, Select, Stack} from '@sanity/ui'

type ProductPickerProps = {
  value: string | null
  onChange: (productId: string | null) => void
}

type ProductOption = {_id: string; title: string | null}

const PRODUCTS_QUERY = `*[_type == "product"]|order(title asc){_id, title}`

export function ProductPicker({value, onChange}: ProductPickerProps) {
  const {data, isPending} = useQuery<ProductOption[]>({query: PRODUCTS_QUERY})

  return (
    <Stack gap={2} style={{opacity: isPending ? 0.7 : 1}}>
      <Label size={1}>Product</Label>
      <Select
        value={value || ''}
        onChange={(event) => {
          const next = event.currentTarget.value
          onChange(next || null)
        }}
      >
        <option value="">Select a product…</option>
        {(data || []).map((product) => (
          <option key={product._id} value={product._id}>
            {product.title || 'Untitled'}
          </option>
        ))}
      </Select>
    </Stack>
  )
}
