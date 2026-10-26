import {useQuery} from '@sanity/sdk-react'
import {Card, Heading, Stack, Text} from '@sanity/ui'
import type {ContentSectionDoc} from '../lib/types'
import {EditableContentSection} from './EditableContentSection'

type ContentPanelProps = {
  sectionId: string
  marketId: string
}

const CONTENT_QUERY = `*[_type == "contentSection" && section._ref == $sectionId && market._ref == $marketId]|order(title asc){
  _id,
  title,
  content,
  "sectionId": section._ref,
  "sectionTitle": section->title
}`

export function ContentPanel({sectionId, marketId}: ContentPanelProps) {
  const {data, isPending} = useQuery<ContentSectionDoc[]>({
    query: CONTENT_QUERY,
    params: {sectionId, marketId},
  })

  const items = data || []

  return (
    <Stack gap={4} style={{opacity: isPending ? 0.6 : 1}}>
      <Stack gap={2}>
        <Heading as="h2" size={1}>
          Content sections
        </Heading>
        <Text muted size={1}>
          Edit title and Portable Text inline, and view or add content-field comments. Changes save as
          drafts.
        </Text>
      </Stack>

      {items.length === 0 ? (
        <Card padding={4} radius={2} tone="transparent" border>
          <Text muted size={1}>
            No content sections for this section and market.
          </Text>
        </Card>
      ) : (
        items.map((item) => <EditableContentSection key={item._id} documentId={item._id} />)
      )}
    </Stack>
  )
}
