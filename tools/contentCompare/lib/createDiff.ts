import type {PortableTextBlock} from '@portabletext/types'
import {portableTextToPlainText} from '../../../lib/portableText'
import type {ContentSectionDoc} from '../../contentExplorer/lib/types'

export type DocumentChangeSummary = {
  added: number
  removed: number
  changed: number
  unchanged: number
}

export type ContentChange =
  | {
      kind: 'added'
      id: string
      title: string
      after: ContentSectionDoc
    }
  | {
      kind: 'removed'
      id: string
      title: string
      before: ContentSectionDoc
    }
  | {
      kind: 'changed'
      id: string
      title: string
      before: ContentSectionDoc
      after: ContentSectionDoc
      titleChanged: boolean
      contentChanged: boolean
    }
export type SectionDiff = {
  sectionId: string
  sectionTitle: string
  changes: ContentChange[]
}

export function createSectionDiffs(
  previous: ContentSectionDoc[],
  current: ContentSectionDoc[],
): {sections: SectionDiff[]; summary: DocumentChangeSummary} {
  const previousById = new Map(previous.map((item) => [item._id, item]))
  const currentById = new Map(current.map((item) => [item._id, item]))
  const ids = new Set([...previousById.keys(), ...currentById.keys()])

  const sectionMap = new Map<string, SectionDiff>()
  const summary: DocumentChangeSummary = {
    added: 0,
    removed: 0,
    changed: 0,
    unchanged: 0,
  }

  for (const id of ids) {
    const before = previousById.get(id)
    const after = currentById.get(id)
    const sectionId = after?.sectionId || before?.sectionId || 'unknown-section'
    const sectionTitle = after?.sectionTitle || before?.sectionTitle || 'Untitled section'

    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, {
        sectionId,
        sectionTitle,
        changes: [],
      })
    }

    const section = sectionMap.get(sectionId)!
    const title = after?.title || before?.title || 'Untitled content'

    if (before && !after) {
      summary.removed += 1
      section.changes.push({kind: 'removed', id, title, before})
      continue
    }

    if (!before && after) {
      summary.added += 1
      section.changes.push({kind: 'added', id, title, after})
      continue
    }

    if (before && after) {
      const titleChanged = (before.title || '') !== (after.title || '')
      const contentChanged =
        portableTextToPlainText(before.content) !== portableTextToPlainText(after.content)

      if (!titleChanged && !contentChanged) {
        summary.unchanged += 1
        continue
      }

      summary.changed += 1
      section.changes.push({
        kind: 'changed',
        id,
        title,
        before: {
          ...before,
          content: (before.content || []) as PortableTextBlock[],
        },
        after: {
          ...after,
          content: (after.content || []) as PortableTextBlock[],
        },
        titleChanged,
        contentChanged,
      })
    }
  }

  const sections = [...sectionMap.values()]
    .filter((section) => section.changes.length > 0)
    .sort((a, b) => a.sectionTitle.localeCompare(b.sectionTitle))

  for (const section of sections) {
    section.changes.sort((a, b) => a.title.localeCompare(b.title))
  }

  return {sections, summary}
}
