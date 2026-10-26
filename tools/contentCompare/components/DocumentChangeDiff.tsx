import {useMemo, type CSSProperties, type ReactNode} from 'react'
import {diffInput, wrap} from '@sanity/diff'
import {Stack, Text} from '@sanity/ui'
import {
  DiffString,
  getPublishedId,
  useSchema,
  useSource,
  type ObjectDiff,
  type ObjectSchemaType,
  type StringDiff,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {portableTextToPlainText} from '../../../lib/portableText'
import type {ContentSectionDoc} from '../../contentExplorer/lib/types'

type DocumentChangeDiffProps = {
  before?: ContentSectionDoc | null
  after?: ContentSectionDoc | null
  /** When true, still render full content even if nothing changed. */
  showUnchanged?: boolean
}

const contentStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.5,
}

/**
 * Shows the full title + content for a contentSection, with Studio DiffString
 * highlights in place (additions / removals inline) rather than from→to cards.
 */
export function DocumentChangeDiff({
  before,
  after,
  showUnchanged = true,
}: DocumentChangeDiffProps) {
  const schema = useSchema()
  const {currentUser} = useSource()
  const schemaType = schema.get('contentSection') as ObjectSchemaType | undefined
  const annotation = useMemo(() => ({author: currentUser?.id || ''}), [currentUser?.id])

  const beforeTitle = before?.title || ''
  const afterTitle = after?.title || ''
  const beforeText = portableTextToPlainText(before?.content)
  const afterText = portableTextToPlainText(after?.content)

  const titleDiff = useMemo(
    () => diffInput(wrap(beforeTitle, annotation), wrap(afterTitle, annotation)) as StringDiff,
    [beforeTitle, afterTitle, annotation],
  )
  const contentDiff = useMemo(
    () => diffInput(wrap(beforeText, annotation), wrap(afterText, annotation)) as StringDiff,
    [beforeText, afterText, annotation],
  )

  const documentId = getPublishedId(after?._id || before?._id || 'unknown')
  const documentValue = useMemo(
    () => ({
      _id: documentId,
      _type: 'contentSection',
      title: afterTitle || beforeTitle || undefined,
      content: after?.content ?? before?.content ?? [],
    }),
    [documentId, afterTitle, beforeTitle, after?.content, before?.content],
  )

  const rootDiff = useMemo(() => {
    return diffInput(
      wrap(
        {
          title: beforeTitle || undefined,
          content: before?.content ?? [],
        },
        annotation,
      ),
      wrap(
        {
          title: afterTitle || undefined,
          content: after?.content ?? [],
        },
        annotation,
      ),
    ) as ObjectDiff
  }, [beforeTitle, afterTitle, before?.content, after?.content, annotation])

  const contextValue = useMemo(
    () => ({
      documentId,
      schemaType: schemaType!,
      rootDiff,
      isComparingCurrent: false,
      FieldWrapper: PassthroughFieldWrapper,
      value: documentValue,
      showFromValue: true,
    }),
    [documentId, schemaType, rootDiff, documentValue],
  )

  const titleChanged = titleDiff.isChanged
  const contentChanged = contentDiff.isChanged

  if (!showUnchanged && !titleChanged && !contentChanged) {
    return null
  }

  const content = (
    <Stack gap={3}>
      <Stack gap={2}>
        <Text size={1} weight="semibold" muted>
          Title
        </Text>
        {titleChanged ? (
          <Text size={1} weight="semibold" style={contentStyle}>
            <DiffString diff={titleDiff} />
          </Text>
        ) : (
          <Text size={1} weight="semibold" style={contentStyle}>
            {afterTitle || beforeTitle || '—'}
          </Text>
        )}
      </Stack>

      <Stack gap={2}>
        <Text size={1} weight="semibold" muted>
          Content
        </Text>
        {contentChanged ? (
          <Text size={1} style={contentStyle}>
            <DiffString diff={contentDiff} />
          </Text>
        ) : (
          <Text size={1} style={contentStyle}>
            {afterText || beforeText || '—'}
          </Text>
        )}
      </Stack>
    </Stack>
  )

  if (!schemaType) {
    return content
  }

  return (
    <DocumentChangeContext.Provider value={contextValue}>{content}</DocumentChangeContext.Provider>
  )
}

function PassthroughFieldWrapper({
  children,
}: {
  path: unknown
  children: ReactNode
  hasRevertHover: boolean
}) {
  return children
}
