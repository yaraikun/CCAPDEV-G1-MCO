import { VoteButtons } from '@/components/ui/VoteButtons'
import { useVoting } from '@/features/votes/VotingContext'
import type {
  PostDetailVoteColumnProps,
} from '../types'

export const PostDetailVoteColumn = ({
  postId,
  upvotes,
  downvotes,
  isUpvoted,
  isDownvoted,
  onUpvote,
  onDownvote,
}: PostDetailVoteColumnProps & { postId: string, upvotes: number, downvotes: number }) => {
  const { getDisplayVotes } = useVoting()
  const display = getDisplayVotes(postId, 'post', upvotes, downvotes)

  return (
    <VoteButtons
      score={display.upvotes - display.downvotes}
      isUpvoted={isUpvoted}
      isDownvoted={isDownvoted}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
      variant="detail"
    />
  )
}
