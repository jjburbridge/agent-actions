import {normalizeContentValue} from '../../../lib/portableText'
import type {ContentSectionDoc} from '../../contentExplorer/lib/types'

export function normalizeExportData(data: unknown): ContentSectionDoc[] {
  if (!Array.isArray(data)) {
    throw new Error('Export file must be a JSON array of content sections')
  }

  return data
    .map((item) => {
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid content section in export file')
      }

      const record = item as Record<string, unknown>
      return {
        _id: String(record._id || ''),
        title: typeof record.title === 'string' ? record.title : null,
        content: normalizeContentValue(record.content),
        sectionId: typeof record.sectionId === 'string' ? record.sectionId : null,
        sectionTitle: typeof record.sectionTitle === 'string' ? record.sectionTitle : null,
      } satisfies ContentSectionDoc
    })
    .sort((a, b) => a._id.localeCompare(b._id))
}
