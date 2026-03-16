import { useCallback } from 'react'
import {
  CommentCardProps,
  VoteType,
  UseCommentVotingReturn,
} from '../types'
import { useVoting } from '@/features/votes/VotingContext'

export function useCommentVoting():
  UseCommentVotingReturn {
  const { votes, toggleVote, getDisplayVotes } = useVoting()

  const handleToggleVote = useCallback(
    (commentId: string, voteType: VoteType) => {
      if (!commentId) return
      toggleVote(commentId, 'comment', voteType)
    },
    [toggleVote],
  )

  const getCommentScore = useCallback(
    (comment: CommentCardProps) => {
      if (!comment) return 0
      const display = getDisplayVotes(comment.id, 'comment', comment.upvotes, comment.downvotes)
      return display.upvotes - display.downvotes
    },
    [getDisplayVotes],
  )

  const addVoteHandlers = useCallback(
    (
      comment: CommentCardProps,
      onEdit?: (
        commentId: string,
        newContent: string,
      ) => void | Promise<void>,
      onDelete?: (
        commentId: string,
      ) => void | Promise<void>,
      onReply?: (
        content: string,
        parentId?: string,
      ) => void | Promise<void>,
    ): CommentCardProps => {
      if (!comment) return comment

      const key = `comment:${comment.id}`
      const voteState = votes[key] || null

      const display = getDisplayVotes(comment.id, 'comment', comment.upvotes, comment.downvotes)

      const handleUpvote = () => {
        handleToggleVote(comment.id, 'up')
      }

      const handleDownvote = () => {
        handleToggleVote(comment.id, 'down')
      }

      const handleEdit = onEdit
        ? (newContent: string) => {
            onEdit(comment.id, newContent)
          }
        : undefined

      const handleDelete = onDelete
        ? () => onDelete(comment.id)
        : undefined

      const handleReply = onReply
        ? (content: string) => {
            onReply(content, comment.id)
          }
        : undefined

      const processedReplies =
        comment.replies?.map((reply) =>
          addVoteHandlers(
            reply,
            onEdit,
            onDelete,
            onReply,
          ),
        )

      return {
        ...comment,
        upvotes: display.upvotes,
        downvotes: display.downvotes,
        isUpvoted: voteState === 'up',
        isDownvoted: voteState === 'down',
        onUpvote: handleUpvote,
        onDownvote: handleDownvote,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onReply: handleReply,
        replies: processedReplies,
      }
    },
    [votes, handleToggleVote, getDisplayVotes],
  )

  return {
    votes,
    toggleVote: handleToggleVote,
    getCommentScore,
    addVoteHandlers,
  }
}
