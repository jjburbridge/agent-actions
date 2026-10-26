import type {PortableTextBlock} from '@portabletext/types'

export type SectionFlat = {
  _id: string
  title: string | null
  parentId: string | null
  hasContent: boolean
}

export type SectionNode = SectionFlat & {
  children: SectionNode[]
}

export type ContentSectionDoc = {
  _id: string
  title: string | null
  content: PortableTextBlock[] | string | null
  sectionId: string | null
  sectionTitle: string | null
}
