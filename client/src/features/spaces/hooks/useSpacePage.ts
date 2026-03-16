import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { spaceService, Space, SortOption } from '../services'
import { isSpaceOwner } from '../utils'
import { Post } from '@/features/posts/types'
import { useLoadingBar } from '@/hooks'
import { useVoting } from '@/features/votes/VotingContext'
import { useAuth } from '@/features/auth/hooks'
import { useToast } from '@/hooks/ToastContext'

export const useSpacePage = (spaceName?: string) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  
  const [space, setSpace] = useState<Space | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('hot')
  const [isJoined, setIsJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  const { startLoading, stopLoading } = useLoadingBar()
  const { votes, toggleVote } = useVoting()

  const loadPosts = async () => {
    if (!spaceName) return
    try {
      const spacePosts = await spaceService.getSpacePosts(spaceName, sortBy)
      setPosts(spacePosts || [])
    } catch (error) {
      setPosts([])
    }
  }

  useEffect(() => {
    const loadSpace = async () => {
      if (!spaceName) { setIsLoading(false); return }
      startLoading()
      setIsLoading(true)
      try {
        const foundSpace = await spaceService.getSpaceByName(spaceName)
        if (foundSpace) {
          setSpace(foundSpace)
          setIsJoined(foundSpace.isJoined || false)
        }
      } finally {
        setIsLoading(false)
        stopLoading()
      }
    }
    loadSpace()
  }, [spaceName])

  useEffect(() => {
    loadPosts()
  }, [spaceName, sortBy])

  const toggleJoin = async () => {
    if (!space) return
    const newJoinStatus = !isJoined
    setIsJoined(newJoinStatus)
    try {
      await spaceService.toggleJoin(space.id)
    } catch (error) {
      setIsJoined(!newJoinStatus)
    }
  }

  const handleDeleteSpace = useCallback(async () => {
    if (!space) return
    setIsDeleting(true)
    try {
      await spaceService.deleteSpace(space.id)
      showSuccess(`r/${space.name} deleted`)
      navigate('/spaces')
    } catch (err) {
      showError('Failed to delete space')
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }, [space, navigate])

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!postId) return
    await toggleVote(postId, 'post', voteType)
  }

  const isOwner = !!user && !!space && isSpaceOwner(space, user.id)

  const postsWithVotes = posts.map(post => ({
    ...post,
    isUpvoted: votes[`post:${post.id}`] === 'up',
    isDownvoted: votes[`post:${post.id}`] === 'down',
  }))

  return {
    space,
    posts: postsWithVotes,
    sortBy,
    setSortBy,
    isJoined,
    isOwner,
    isLoading,
    isLoadingPosts,
    isDeleting,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    toggleJoin,
    handleDeleteSpace,
    handleCreatePost: () => {
      const url = space ? `/post/create?space=${space.name}` : '/post/create'
      navigate(url)
    },
    handleVote,
    navigate,
  }
}
