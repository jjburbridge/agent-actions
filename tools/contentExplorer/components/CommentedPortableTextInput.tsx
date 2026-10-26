import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import type {Comment} from '@sanity/sdk'
import {AddCommentIcon} from '@sanity/icons/AddComment'
import {PortableTextEditor, type EditorSelection} from '@portabletext/editor'
import {Box, Button, Card, Stack, useClickOutsideEvent} from '@sanity/ui'
import {ContentCommentsToolbar} from './ContentComments'
import {
  buildCommentRangeDecorations,
  buildTextSelectionFromFragment,
  CommentInlineHighlightSpan,
  isArrayOfBlocksInputProps,
  isPortableTextTextBlock,
  type InputProps,
  type PortableTextInputProps,
} from 'sanity'
import {useContentCommentsOptional} from '../lib/contentCommentsContext'

export function CommentedPortableTextInput(props: InputProps) {
  if (!isArrayOfBlocksInputProps(props)) {
    return props.renderDefault(props)
  }

  return <CommentedBlocksInput {...(props as unknown as PortableTextInputProps)} />
}

function CommentedBlocksInput(props: PortableTextInputProps) {
  const comments = useContentCommentsOptional()
  const editorRef = useRef<PortableTextEditor | null>(null)
  const floatingRef = useRef<HTMLDivElement | null>(null)

  const [mousePressed, setMousePressed] = useState(false)
  const [currentSelection, setCurrentSelection] = useState<EditorSelection | null>(null)
  const [currentSelectionRect, setCurrentSelectionRect] = useState<DOMRect | null>(null)
  const [canSubmit, setCanSubmit] = useState(false)

  const studioComments = useMemo(
    () =>
      (comments?.threads || [])
        .map((thread) => thread.parentComment)
        .filter((comment) => comment.selection?.type === 'text')
        .map(toStudioComment),
    [comments?.threads],
  )

  const handleDecorationClick = useCallback(
    (commentId: string) => {
      comments?.selectThreadByCommentId(commentId)
    },
    [comments],
  )

  const handleHoverStart = useCallback(
    (commentId: string) => {
      comments?.setHoveredCommentId(commentId)
    },
    [comments],
  )

  const handleHoverEnd = useCallback(() => {
    comments?.setHoveredCommentId(null)
  }, [comments])

  const updateSelectionRect = useCallback(() => {
    setCurrentSelectionRect(getSelectionBoundingRect())
  }, [])

  const clearSelectionUi = useCallback(() => {
    setCanSubmit(false)
    setCurrentSelection(null)
    setCurrentSelectionRect(null)
  }, [])

  const handleEditorChange = useCallback(
    (change: {type: string; selection?: EditorSelection | null}, editor: PortableTextEditor) => {
      props.onEditorChange?.(change as never, editor)

      if (change.type === 'blur' || change.type !== 'selection') return
      if (comments?.inlineDraft) return

      const selection = change.selection || null
      const fragment = PortableTextEditor.getFragment(editor) || []
      const isRangeSelected =
        !!selection &&
        (JSON.stringify(selection.anchor.path) !== JSON.stringify(selection.focus.path) ||
          selection.anchor.offset !== selection.focus.offset)
      const onlyTextBlocks = fragment.length > 0 && fragment.every(isPortableTextTextBlock)

      if (!isRangeSelected || !onlyTextBlocks) {
        clearSelectionUi()
        return
      }

      if (!mousePressed) {
        updateSelectionRect()
      }
      setCurrentSelection(selection)
      setCanSubmit(true)
    },
    [clearSelectionUi, comments?.inlineDraft, mousePressed, props, updateSelectionRect],
  )

  const handleAddCommentMouseDown = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (!comments || !currentSelection || !editorRef.current) return

      const fragment = PortableTextEditor.getFragment(editorRef.current) || []
      if (!fragment.length) return

      const normalizedSelection = currentSelection.backward
        ? {
            backward: false,
            anchor: currentSelection.focus,
            focus: currentSelection.anchor,
          }
        : currentSelection

      const textSelection = buildTextSelectionFromFragment({
        fragment: fragment as never,
        selection: normalizedSelection as never,
        documentValue: props.value,
        basePath: [],
      })

      comments.beginInlineComment({
        editorSelection: currentSelection,
        textSelection,
        contentSnapshot: fragment,
        previewText: fragmentToPlainText(fragment),
      })
      clearSelectionUi()
    },
    [clearSelectionUi, comments, currentSelection, props.value],
  )

  useClickOutsideEvent(
    () => {
      if (comments?.inlineDraft) return
      if (canSubmit) clearSelectionUi()
    },
    () => [floatingRef.current],
  )

  useEffect(() => {
    if (!currentSelectionRect) return
    const onScroll = () => updateSelectionRect()
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [currentSelectionRect, updateSelectionRect])

  const authoringDecoration = useMemo(() => {
    if (!comments?.inlineDraft?.editorSelection) return null
    return {
      selection: comments.inlineDraft.editorSelection,
      component: ({children}: {children?: ReactNode}) => (
        <CommentInlineHighlightSpan isAuthoring>{children}</CommentInlineHighlightSpan>
      ),
    }
  }, [comments?.inlineDraft?.editorSelection])

  const rangeDecorations = useMemo(() => {
    const existing = props.rangeDecorations || []
    const built =
      comments && studioComments.length > 0
        ? buildCommentRangeDecorations({
            comments: studioComments as never,
            currentHoveredCommentId: comments.hoveredCommentId,
            onDecorationClick: handleDecorationClick,
            onDecorationHoverEnd: handleHoverEnd,
            onDecorationHoverStart: handleHoverStart,
            onDecorationMoved: () => undefined,
            selectedThreadId: comments.selectedThreadId,
            value: (props.value || []) as never,
          })
        : []

    return [...existing, ...(authoringDecoration ? [authoringDecoration] : []), ...built]
  }, [
    authoringDecoration,
    comments,
    handleDecorationClick,
    handleHoverEnd,
    handleHoverStart,
    props.rangeDecorations,
    props.value,
    studioComments,
  ])

  const showFloatingButton = !!(
    comments &&
    !comments.inlineDraft &&
    currentSelection &&
    canSubmit &&
    currentSelectionRect &&
    !mousePressed
  )

  return (
    <Stack gap={2}>
      <ContentCommentsToolbar />
      <Box
        onMouseDown={() => setMousePressed(true)}
        onMouseUp={() => {
          setMousePressed(false)
          if (canSubmit || currentSelection) updateSelectionRect()
        }}
      >
        {props.renderDefault({
          ...props,
          editorRef,
          onEditorChange: handleEditorChange,
          rangeDecorations,
        })}

        {showFloatingButton && currentSelectionRect && (
          <div
            ref={floatingRef}
            contentEditable={false}
            style={{
              position: 'fixed',
              top: currentSelectionRect.bottom + 6,
              left: currentSelectionRect.left + currentSelectionRect.width / 2,
              transform: 'translateX(-50%)',
              zIndex: 10000,
              userSelect: 'none',
            }}
          >
            <Card padding={1} radius={2} shadow={2} border>
              <Button
                data-testid="inline-comment-button"
                icon={AddCommentIcon}
                mode="bleed"
                fontSize={1}
                padding={2}
                text="Add comment"
                onMouseDown={handleAddCommentMouseDown}
              />
            </Card>
          </div>
        )}
      </Box>
    </Stack>
  )
}

function getSelectionBoundingRect(): DOMRect | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  return selection.getRangeAt(0).getBoundingClientRect() || null
}

function fragmentToPlainText(fragment: unknown[]): string {
  return fragment
    .map((block) => {
      if (!block || typeof block !== 'object' || !('children' in block)) return ''
      const children = (block as {children?: {_type?: string; text?: string}[]}).children
      if (!Array.isArray(children)) return ''
      return children.map((child) => (child?._type === 'span' ? child.text || '' : '')).join('')
    })
    .filter(Boolean)
    .join(' ')
}

function toStudioComment(comment: Comment) {
  return {
    _id: comment.id,
    threadId: comment.threadId,
    target: {
      path: {
        field: comment.fieldPath,
        selection: comment.selection,
      },
    },
  }
}
