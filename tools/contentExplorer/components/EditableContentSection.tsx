import {useMemo} from 'react'
import {Box, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {
  FormBuilder,
  createPatchChannel,
  getPublishedId,
  useDocumentForm,
  type ObjectFormNode,
} from 'sanity'
import {ContentComments} from './ContentComments'
import {CommentedPortableTextInput} from './CommentedPortableTextInput'
import {ContentCommentsProvider} from '../lib/contentCommentsContext'

const EDITABLE_FIELDS = new Set(['title', 'content'])

type EditableContentSectionProps = {
  documentId: string
}

export function EditableContentSection({documentId}: EditableContentSectionProps) {
  const publishedId = getPublishedId(documentId)
  const patchChannel = useMemo(() => createPatchChannel(), [])

  const {
    collapsedFieldSets,
    collapsedPaths,
    focusPath,
    formState,
    onBlur,
    onChange,
    onFocus,
    onPathOpen,
    onSetActiveFieldGroup,
    onSetCollapsedFieldSet,
    onSetCollapsedPath,
    openPath,
    ready,
    schemaType,
    validation,
    value,
  } = useDocumentForm({
    documentId: publishedId,
    documentType: 'contentSection',
  })

  const members = useMemo(() => {
    if (!formState) return []
    return (formState as ObjectFormNode).members
      .filter((member) => member.kind === 'field' && EDITABLE_FIELDS.has(member.name))
      .map((member) => {
        if (member.kind !== 'field' || member.name !== 'content') return member
        return {
          ...member,
          field: {
            ...member.field,
            schemaType: {
              ...member.field.schemaType,
              components: {
                ...member.field.schemaType.components,
                input: CommentedPortableTextInput,
              },
            },
          },
        }
      })
  }, [formState])

  if (!ready || !formState) {
    return (
      <Flex align="center" justify="center" padding={4}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <ContentCommentsProvider documentId={publishedId}>
      <Card padding={4} radius={2} shadow={1} border>
        <Stack gap={3}>
          <Text size={1} muted>
            Editing saves as a draft. Publish from the document pane when ready. Comment highlights
            appear in the content field — click one to open it below.
          </Text>
          <Box>
            <FormBuilder
              __internal_patchChannel={patchChannel}
              changed={formState.changed}
              changesOpen={false}
              collapsedFieldSets={collapsedFieldSets}
              collapsedPaths={collapsedPaths}
              focusPath={focusPath}
              focused={formState.focused}
              groups={formState.groups}
              hasUpstreamVersion={false}
              id={publishedId}
              members={members}
              onChange={onChange}
              onFieldGroupSelect={onSetActiveFieldGroup}
              onPathBlur={onBlur}
              onPathFocus={onFocus}
              onPathOpen={onPathOpen}
              onSetFieldSetCollapsed={onSetCollapsedFieldSet}
              onSetPathCollapsed={onSetCollapsedPath}
              openPath={openPath}
              presence={[]}
              readOnly={formState.readOnly}
              schemaType={schemaType}
              validation={validation}
              value={value}
            />
          </Box>
          <ContentComments />
        </Stack>
      </Card>
    </ContentCommentsProvider>
  )
}
