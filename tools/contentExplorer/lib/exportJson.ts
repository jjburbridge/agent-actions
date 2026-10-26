import type {SanityClient} from 'sanity'
import type {ContentSectionDoc} from './types'

export function downloadJson(filename: string, data: ContentSectionDoc[]) {
  const blob = createJsonBlob(data)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function createJsonBlob(data: ContentSectionDoc[]) {
  return new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})
}

type SaveExportHistoryOptions = {
  client: SanityClient
  productId: string
  marketId: string
  filename: string
  data: ContentSectionDoc[]
}

export async function saveExportHistory({
  client,
  productId,
  marketId,
  filename,
  data,
}: SaveExportHistoryOptions) {
  const exportedAt = new Date().toISOString()
  const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`
  const blob = createJsonBlob(data)

  const asset = await client.assets.upload('file', blob, {
    filename: jsonFilename,
    contentType: 'application/json',
  })

  const historyDoc = await client.create({
    _type: 'exportHistory',
    product: {_type: 'reference', _ref: productId},
    market: {_type: 'reference', _ref: marketId},
    exportedAt,
    file: {
      _type: 'file',
      asset: {_type: 'reference', _ref: asset._id},
    },
  })

  downloadJson(jsonFilename, data)

  return historyDoc
}
