import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  useCommentActions,
  useCommentThreads,
  type CommentThread,
} from '@sanity/sdk-react'
import type {CommentMessage, CommentTextSelection} from '@sanity/sdk'
import type {EditorSelection} from '@portabletext/editor'
import {textToPortableText} from '../../../lib/portableText'

export type InlineCommentDraft = {
  editorSelection: EditorSelection
  textSelection: CommentTextSelection
  contentSnapshot: unknown
  previewText: string
}

export type ContentCommentsContextValue = {
  documentId: string
  threads: CommentThread[]
  isPending: boolean
  selectedThreadId: string | null
  hoveredCommentId: string | null
  inlineDraft: InlineCommentDraft | null
  isListOpen: boolean
  setSelectedThreadId: (threadId: string | null) => void
  setHoveredCommentId: (commentId: string | null) => void
  selectThreadByCommentId: (commentId: string) => void
  openCommentList: () => void
  closeCommentList: () => void
  beginInlineComment: (draft: InlineCommentDraft) => void
  cancelInlineComment: () => void
  submitInlineComment: (message: string) => Promise<void>
  createFieldComment: (message: string) => Promise<void>
  replyToSelected: (message: string) => Promise<void>
  toggleSelectedStatus: () => Promise<void>
  isSubmitting: boolean
}

const ContentCommentsContext = createContext<ContentCommentsContextValue | null>(null)

function createEmptyValue(documentId: string): ContentCommentsContextValue {
  return {
    documentId,
    threads: [],
    isPending: true,
    selectedThreadId: null,
    hoveredCommentId: null,
    inlineDraft: null,
    isListOpen: false,
    setSelectedThreadId: () => undefined,
    setHoveredCommentId: () => undefined,
    selectThreadByCommentId: () => undefined,
    openCommentList: () => undefined,
    closeCommentList: () => undefined,
    beginInlineComment: () => undefined,
    cancelInlineComment: () => undefined,
    submitInlineComment: async () => undefined,
    createFieldComment: async () => undefined,
    replyToSelected: async () => undefined,
    toggleSelectedStatus: async () => undefined,
    isSubmitting: false,
  }
}

export function ContentCommentsProvider({
  documentId,
  children,
}: {
  documentId: string
  children: ReactNode
}) {
  return (
    <Suspense
      fallback={
        <ContentCommentsContext.Provider value={createEmptyValue(documentId)}>
          {children}
        </ContentCommentsContext.Provider>
      }
    >
      <ContentCommentsProviderInner documentId={documentId}>{children}</ContentCommentsProviderInner>
    </Suspense>
  )
}

function ContentCommentsProviderInner({
  documentId,
  children,
}: {
  documentId: string
  children: ReactNode
}) {
  const {threads, isPending} = useCommentThreads({
    documentId,
    documentType: 'contentSection',
    fieldPath: 'content',
    status: 'open',
  })
  const {createComment, replyToComment, setCommentStatus} = useCommentActions()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const [inlineDraft, setInlineDraft] = useState<InlineCommentDraft | null>(null)
  const [isListOpen, setIsListOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const beginInlineComment = useCallback((draft: InlineCommentDraft) => {
    setSelectedThreadId(null)
    setIsListOpen(false)
    setInlineDraft(draft)
  }, [])

  const cancelInlineComment = useCallback(() => {
    setInlineDraft(null)
  }, [])

  const openCommentList = useCallback(() => {
    setInlineDraft(null)
    setSelectedThreadId(null)
    setIsListOpen(true)
  }, [])

  const closeCommentList = useCallback(() => {
    setIsListOpen(false)
  }, [])

  const value = useMemo<ContentCommentsContextValue>(() => {
    const selectedThread = threads.find((thread) => thread.threadId === selectedThreadId) || null

    return {
      documentId,
      threads,
      isPending,
      selectedThreadId,
      hoveredCommentId,
      inlineDraft,
      isListOpen,
      setSelectedThreadId(threadId) {
        setInlineDraft(null)
        setIsListOpen(false)
        setSelectedThreadId(threadId)
      },
      setHoveredCommentId,
      selectThreadByCommentId(commentId) {
        const thread = threads.find(
          (item) =>
            item.parentComment.id === commentId ||
            item.replies.some((reply) => reply.id === commentId),
        )
        if (!thread) return
        setInlineDraft(null)
        setIsListOpen(false)
        setSelectedThreadId((current) => (current === thread.threadId ? null : thread.threadId))
      },
      openCommentList,
      closeCommentList,
      beginInlineComment,
      cancelInlineComment,
      async submitInlineComment(message) {
        const trimmed = message.trim()
        if (!trimmed || isSubmitting || !inlineDraft) return
        setIsSubmitting(true)
        try {
          const created = await createComment({
            documentId,
            documentType: 'contentSection',
            fieldPath: 'content',
            message: textToPortableText(trimmed) as CommentMessage,
            selection: inlineDraft.textSelection,
            contentSnapshot: inlineDraft.contentSnapshot,
          })
          setInlineDraft(null)
          setSelectedThreadId(created.threadId)
        } finally {
          setIsSubmitting(false)
        }
      },
      async createFieldComment(message) {
        const trimmed = message.trim()
        if (!trimmed || isSubmitting) return
        setIsSubmitting(true)
        try {
          const created = await createComment({
            documentId,
            documentType: 'contentSection',
            fieldPath: 'content',
            message: textToPortableText(trimmed) as CommentMessage,
          })
          setInlineDraft(null)
          setSelectedThreadId(created.threadId)
        } finally {
          setIsSubmitting(false)
        }
      },
      async replyToSelected(message) {
        if (!selectedThread) return
        const trimmed = message.trim()
        if (!trimmed || isSubmitting) return
        setIsSubmitting(true)
        try {
          await replyToComment({
            documentId,
            documentType: 'contentSection',
            parentCommentId: selectedThread.parentComment.id,
            message: textToPortableText(trimmed) as CommentMessage,
          })
        } finally {
          setIsSubmitting(false)
        }
      },
      async toggleSelectedStatus() {
        if (!selectedThread) return
        await setCommentStatus({
          commentId: selectedThread.parentComment.id,
          status: selectedThread.status === 'open' ? 'resolved' : 'open',
        })
        setSelectedThreadId(null)
      },
      isSubmitting,
    }
  }, [
    beginInlineComment,
    cancelInlineComment,
    closeCommentList,
    createComment,
    documentId,
    hoveredCommentId,
    inlineDraft,
    isListOpen,
    isPending,
    isSubmitting,
    openCommentList,
    replyToComment,
    selectedThreadId,
    setCommentStatus,
    threads,
  ])

  return (
    <ContentCommentsContext.Provider value={value}>{children}</ContentCommentsContext.Provider>
  )
}

export function useContentComments(): ContentCommentsContextValue {
  const value = useContext(ContentCommentsContext)
  if (!value) {
    throw new Error('useContentComments must be used within ContentCommentsProvider')
  }
  return value
}

export function useContentCommentsOptional(): ContentCommentsContextValue | null {
  return useContext(ContentCommentsContext)
}
