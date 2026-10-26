import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {useUser, type Comment, type CommentThread} from '@sanity/sdk-react'
import {CommentIcon} from '@sanity/icons/Comment'
import {Badge, Button, Card, Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {PortableTextContent} from '../../../components/PortableTextContent'
import {useContentComments, useContentCommentsOptional} from '../lib/contentCommentsContext'

const WHITE_INPUT_STYLE: CSSProperties = {
  backgroundColor: '#fff',
  color: '#0d0e12',
}

/** Studio-style comment icon that sits above the Portable Text field. */
export function ContentCommentsToolbar() {
  const comments = useContentCommentsOptional()
  if (!comments) return null

  const {threads, isPending, isListOpen, openCommentList, closeCommentList} = comments
  const count = threads.length

  return (
    <Flex align="center" justify="flex-end" style={{opacity: isPending ? 0.7 : 1}}>
      <Button
        icon={CommentIcon}
        mode={isListOpen || count ? 'default' : 'bleed'}
        fontSize={1}
        padding={2}
        text={String(count)}
        tone={count ? 'caution' : 'default'}
        selected={isListOpen}
        aria-label={count ? `View ${count} comments` : 'Open comments'}
        onClick={() => {
          if (isListOpen) closeCommentList()
          else openCommentList()
        }}
      />
    </Flex>
  )
}

export function ContentComments() {
  const {
    threads,
    isPending,
    selectedThreadId,
    setSelectedThreadId,
    inlineDraft,
    isListOpen,
    closeCommentList,
    openCommentList,
    cancelInlineComment,
    submitInlineComment,
    createFieldComment,
    replyToSelected,
    toggleSelectedStatus,
    isSubmitting,
  } = useContentComments()

  const [draft, setDraft] = useState('')
  const [inlineMessage, setInlineMessage] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const panelRef = useRef<HTMLDivElement | null>(null)
  const selectedThread = threads.find((thread) => thread.threadId === selectedThreadId) || null

  useEffect(() => {
    if (!inlineDraft && !isListOpen && !selectedThreadId) return
    panelRef.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'})
  }, [inlineDraft, isListOpen, selectedThreadId])

  useEffect(() => {
    if (!inlineDraft) setInlineMessage('')
  }, [inlineDraft])

  return (
    <Stack gap={3} ref={panelRef} style={{opacity: isPending ? 0.7 : 1}}>
      {inlineDraft ? (
        <Card padding={4} radius={2} border tone="primary">
          <Stack gap={3}>
            <Flex align="center" justify="space-between" gap={3} wrap="wrap">
              <Badge tone="primary">New comment</Badge>
              <Button
                text="Cancel"
                mode="bleed"
                fontSize={1}
                padding={2}
                onClick={cancelInlineComment}
              />
            </Flex>

            {inlineDraft.previewText ? (
              <Card padding={3} radius={2} tone="transparent" border>
                <Stack gap={2}>
                  <Text size={0} muted>
                    Selected text
                  </Text>
                  <Text size={1} style={{fontStyle: 'italic'}}>
                    {inlineDraft.previewText}
                  </Text>
                </Stack>
              </Card>
            ) : null}

            <WhiteField>
              <TextArea
                fontSize={1}
                padding={3}
                rows={4}
                placeholder="Write your comment…"
                value={inlineMessage}
                autoFocus
                style={WHITE_INPUT_STYLE}
                onChange={(event) => setInlineMessage(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    cancelInlineComment()
                  }
                }}
              />
            </WhiteField>
            <Flex justify="flex-end" gap={2}>
              <Button
                text="Cancel"
                mode="ghost"
                fontSize={1}
                padding={2}
                onClick={cancelInlineComment}
              />
              <Button
                text="Comment"
                tone="primary"
                fontSize={1}
                padding={2}
                disabled={!inlineMessage.trim() || isSubmitting}
                onClick={() => void submitInlineComment(inlineMessage)}
              />
            </Flex>
          </Stack>
        </Card>
      ) : isListOpen ? (
        <Card padding={4} radius={2} border>
          <Stack gap={4}>
            <Flex align="center" justify="space-between" gap={3} wrap="wrap">
              <Stack gap={2}>
                <Text size={1} weight="semibold">
                  All comments
                </Text>
                <Text size={0} muted>
                  {threads.length} open thread{threads.length === 1 ? '' : 's'}
                </Text>
              </Stack>
              <Button text="Close" mode="bleed" fontSize={1} padding={2} onClick={closeCommentList} />
            </Flex>

            <Card padding={3} radius={2} border tone="transparent">
              <Stack gap={2}>
                <Text size={1} weight="semibold">
                  Add a comment
                </Text>
                <Text size={0} muted>
                  Or select text in the content field to comment on a passage.
                </Text>
                <WhiteField>
                  <TextArea
                    fontSize={1}
                    padding={3}
                    rows={3}
                    placeholder="Write a new comment…"
                    value={draft}
                    style={WHITE_INPUT_STYLE}
                    onChange={(event) => setDraft(event.currentTarget.value)}
                  />
                </WhiteField>
                <Flex justify="flex-end">
                  <Button
                    text="Comment"
                    tone="primary"
                    fontSize={1}
                    padding={2}
                    disabled={!draft.trim() || isSubmitting}
                    onClick={async () => {
                      await createFieldComment(draft)
                      setDraft('')
                    }}
                  />
                </Flex>
              </Stack>
            </Card>

            {threads.length === 0 ? (
              <Text muted size={1}>
                No open comments yet.
              </Text>
            ) : (
              <Stack gap={3}>
                {threads.map((thread) => (
                  <ThreadListItem
                    key={thread.threadId}
                    thread={thread}
                    onSelect={() => setSelectedThreadId(thread.threadId)}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      ) : selectedThread ? (
        <SelectedThreadPanel
          thread={selectedThread}
          replyDraft={replyDraft}
          onReplyDraftChange={setReplyDraft}
          onReply={async () => {
            await replyToSelected(replyDraft)
            setReplyDraft('')
          }}
          onClose={() => setSelectedThreadId(null)}
          onBackToList={openCommentList}
          onToggleStatus={toggleSelectedStatus}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </Stack>
  )
}

function ThreadListItem({
  thread,
  onSelect,
}: {
  thread: CommentThread
  onSelect: () => void
}) {
  return (
    <Card
      padding={3}
      radius={2}
      border
      tone="transparent"
      style={{cursor: 'pointer'}}
      onClick={onSelect}
    >
      <Stack gap={3}>
        <Flex align="center" justify="space-between" gap={2} wrap="wrap">
          <Flex gap={2} align="center">
            <Badge tone="caution">{thread.status}</Badge>
            <Text size={0} muted>
              {thread.commentsCount} comment{thread.commentsCount === 1 ? '' : 's'}
            </Text>
          </Flex>
          <Text size={0} muted>
            {new Date(thread.lastActivityAt).toLocaleString()}
          </Text>
        </Flex>

        {thread.parentComment.contentSnapshot != null && (
          <Text size={1} style={{fontStyle: 'italic'}}>
            “{snapshotToPlainText(thread.parentComment.contentSnapshot)}”
          </Text>
        )}

        <CommentBody comment={thread.parentComment} />
      </Stack>
    </Card>
  )
}

function SelectedThreadPanel({
  thread,
  replyDraft,
  onReplyDraftChange,
  onReply,
  onClose,
  onBackToList,
  onToggleStatus,
  isSubmitting,
}: {
  thread: CommentThread
  replyDraft: string
  onReplyDraftChange: (value: string) => void
  onReply: () => void
  onClose: () => void
  onBackToList: () => void
  onToggleStatus: () => void
  isSubmitting: boolean
}) {
  return (
    <Card padding={4} radius={2} border tone="caution">
      <Stack gap={4}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack gap={2}>
            <Flex gap={2} align="center">
              <Badge tone="caution">Selected</Badge>
              <Badge tone={thread.status === 'open' ? 'caution' : 'positive'}>{thread.status}</Badge>
            </Flex>
            <Text size={0} muted>
              {thread.commentsCount} comment{thread.commentsCount === 1 ? '' : 's'} ·{' '}
              {new Date(thread.lastActivityAt).toLocaleString()}
            </Text>
          </Stack>
          <Flex gap={2}>
            <Button text="All comments" mode="bleed" fontSize={1} padding={2} onClick={onBackToList} />
            <Button text="Close" mode="bleed" fontSize={1} padding={2} onClick={onClose} />
          </Flex>
        </Flex>

        {thread.parentComment.contentSnapshot != null && (
          <Card padding={3} radius={2} tone="transparent" border>
            <Stack gap={2}>
              <Text size={0} muted>
                Commented text
              </Text>
              <Text size={1} style={{fontStyle: 'italic'}}>
                {snapshotToPlainText(thread.parentComment.contentSnapshot)}
              </Text>
            </Stack>
          </Card>
        )}

        <CommentBody comment={thread.parentComment} />

        {thread.replies.length > 0 && (
          <Stack gap={3} paddingLeft={3} style={{borderLeft: '2px solid var(--card-border-color)'}}>
            {thread.replies.map((reply) => (
              <CommentBody key={reply.id} comment={reply} />
            ))}
          </Stack>
        )}

        <Stack gap={2}>
          <WhiteField>
            <TextInput
              fontSize={1}
              padding={3}
              placeholder="Reply…"
              value={replyDraft}
              style={WHITE_INPUT_STYLE}
              onChange={(event) => onReplyDraftChange(event.currentTarget.value)}
            />
          </WhiteField>
          <Flex gap={2} justify="flex-end" wrap="wrap">
            <Button
              text={thread.status === 'open' ? 'Resolve' : 'Reopen'}
              mode="ghost"
              fontSize={1}
              padding={2}
              onClick={onToggleStatus}
            />
            <Button
              text="Reply"
              tone="primary"
              fontSize={1}
              padding={2}
              disabled={!replyDraft.trim() || isSubmitting}
              onClick={onReply}
            />
          </Flex>
        </Stack>
      </Stack>
    </Card>
  )
}

function CommentBody({comment}: {comment: Comment}) {
  return (
    <Stack gap={2}>
      <Flex align="center" gap={2} wrap="wrap">
        {comment.authorId ? (
          <CommentAuthor userId={comment.authorId} />
        ) : (
          <Text size={0} weight="semibold">
            Unknown author
          </Text>
        )}
        <Text size={0} muted>
          {new Date(comment.createdAt).toLocaleString()}
          {comment.lastEditedAt ? ' · edited' : ''}
        </Text>
      </Flex>
      <PortableTextContent value={comment.message} />
    </Stack>
  )
}

function CommentAuthor({userId}: {userId: string}) {
  const {data, isPending} = useUser({userId})
  const name = isPending ? '…' : data?.profile?.displayName || userId

  return (
    <Text size={0} weight="semibold">
      {name}
    </Text>
  )
}

function WhiteField({children}: {children: ReactNode}) {
  return (
    <Card tone="default" border radius={2} overflow="hidden" style={{backgroundColor: '#fff'}}>
      {children}
    </Card>
  )
}

function snapshotToPlainText(snapshot: unknown): string {
  if (typeof snapshot === 'string') return snapshot
  if (!Array.isArray(snapshot)) return '—'

  return snapshot
    .map((block) => {
      if (
        !block ||
        typeof block !== 'object' ||
        !('children' in block) ||
        !Array.isArray(block.children)
      ) {
        return ''
      }
      return block.children
        .map((child: {_type?: string; text?: string}) =>
          child?._type === 'span' ? child.text || '' : '',
        )
        .join('')
    })
    .filter(Boolean)
    .join(' ')
}
