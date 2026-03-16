import { VoteButtons } from '@/components/ui/VoteButtons'
import { useVoting } from '@/features/votes/VotingContext'
import type { CommentVotingProps } from './types'

export const CommentVoting = ({
  id,
  upvotes,
  downvotes,
  isUpvoted = false,
  isDownvoted = false,
  isDeleted = false,
  onUpvote,
  onDownvote,
}: CommentVotingProps & { id: string }) => {
  const { getDisplayVotes } = useVoting()
  
  if (isDeleted) return null

  const display = getDisplayVotes(id, 'comment', upvotes, downvotes)

  return (
    <VoteButtons
      score={display.upvotes - display.downvotes}
      isUpvoted={isUpvoted}
      isDownvoted={isDownvoted}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
      variant="comment"
    />
  )
}
