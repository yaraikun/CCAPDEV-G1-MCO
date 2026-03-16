import { VoteButtons } from '@/components/ui/VoteButtons'
import { useVoting } from '@/features/votes/VotingContext'
import type { PostCardVotingProps } from './types'

export const PostCardVoting = ({
  id,
  upvotes,
  downvotes,
  isUpvoted = false,
  isDownvoted = false,
  onUpvote,
  onDownvote,
}: PostCardVotingProps) => {
  const { getDisplayVotes } = useVoting()
  const display = getDisplayVotes(id, 'post', upvotes, downvotes)

  return (
    <VoteButtons
      score={display.upvotes - display.downvotes}
      isUpvoted={isUpvoted}
      isDownvoted={isDownvoted}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
      variant="card"
    />
  )
}
