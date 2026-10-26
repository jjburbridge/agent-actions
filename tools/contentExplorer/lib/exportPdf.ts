import {jsPDF} from 'jspdf'
import {portableTextToPlainText} from '../../../lib/portableText'
import type {ContentSectionDoc} from './types'

export function downloadContentPdf(filename: string, items: ContentSectionDoc[]) {
  const doc = new jsPDF({unit: 'pt', format: 'a4'})
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const maxWidth = pageWidth - margin * 2
  let y = margin
  let lastSectionTitle: string | null = null

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  const writeWrapped = (text: string, fontSize: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text || '—', maxWidth) as string[]
    for (const line of lines) {
      ensureSpace(fontSize + 6)
      doc.text(line, margin, y)
      y += fontSize + 4
    }
  }

  if (items.length === 0) {
    writeWrapped('No content sections to export.', 12)
  }

  for (const [index, item] of items.entries()) {
    if (index > 0) {
      y += 12
      ensureSpace(24)
    }

    const sectionTitle = item.sectionTitle || 'Untitled section'
    if (sectionTitle !== lastSectionTitle) {
      writeWrapped(sectionTitle, 14, 'bold')
      y += 4
      lastSectionTitle = sectionTitle
    }

    writeWrapped(item.title || 'Untitled', 12, 'bold')
    y += 2
    writeWrapped(portableTextToPlainText(item.content), 11)
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
