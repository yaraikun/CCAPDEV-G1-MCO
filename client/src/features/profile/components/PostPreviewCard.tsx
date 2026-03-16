import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PostCard } from "@/features/posts/components"
import { DeletePostModal } from "@/features/posts/components"
import { commentService } from "@/features/comments/services"
import { postService } from "@/features/posts/services"
import { getTotalCommentCount } from "@/features/comments/utils/comment-utils"
import { useVoting } from "@/features/votes/VotingContext"
import { getCurrentUser } from "@/features/auth/services/authService"

export function PostPreviewCard({ post, onUpdate }: { 
  post: any
  onUpdate?: () => void 
}) {
  const navigate = useNavigate()
  const [commentCount, setCommentCount] = useState<number>(post.commentCount)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  const { votes, toggleVote } = useVoting()

  useEffect(() => {
    const loadComments = async () => {
      if (!post?.id) return
      try {
        const comments = await commentService.getCommentsByPostId(post.id)
        setCommentCount(getTotalCommentCount(comments))
      } catch (err) {
        console.warn('Failed to load comment count:', err)
        setCommentCount(post.commentCount || 0)
      }
    }
    loadComments()
  }, [post.id, post.commentCount])

  useEffect(() => {
    getCurrentUser().then(user => {
      setIsOwner(!!user && !!post?.author && user.id === post.author.id)
    })
  }, [post?.author?.id])

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!post?.id) return
    await toggleVote(post.id, 'post', voteType)
    if (onUpdate) onUpdate()
  }

  const handleDelete = async () => {
    if (!post?.id) return
    try {
      await postService.deletePost(post.id)
      setIsDeleteModalOpen(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to delete post:', error)
      throw error
    }
  }

  const voteKey = `post:${post.id}`
  const voteState = votes[voteKey]

  return (
    <>
      <PostCard
        {...post}
        commentCount={commentCount}
        isUpvoted={voteState === 'up'}
        isDownvoted={voteState === 'down'}
        onClick={() => navigate(`/post/${post.id}`)}
        onUpvote={() => handleVote("up")}
        onDownvote={() => handleVote("down")}
        onEdit={isOwner ? () => navigate(`/post/${post.id}/edit`) : undefined}
        onDelete={isOwner ? () => setIsDeleteModalOpen(true) : undefined}
      />

      <DeletePostModal
        isOpen={isDeleteModalOpen}
        postTitle={post.title}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  )
}
