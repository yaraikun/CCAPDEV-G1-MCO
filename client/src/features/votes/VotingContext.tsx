import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode
} from 'react'
import { voteService } from './services/voteService'
import { getCurrentUser } from '@/features/auth/services/authService'
import { useAuthChangeListener } from '@/features/auth/AuthContext'

type VoteType = 'up' | 'down' | null
type TargetType = 'post' | 'comment' | 'Post' | 'Comment'

const normalizeType = (t: TargetType): 'post' | 'comment' =>
  t.toLowerCase() as 'post' | 'comment'

const capitalizeType = (t: TargetType): 'Post' | 'Comment' =>
  (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) as 'Post' | 'Comment'

interface VotingContextValue {
  votes: Record<string, VoteType>
  toggleVote: (
    targetId: string,
    targetType: TargetType,
    voteType: VoteType
  ) => Promise<void>
  getDisplayVotes: (
    targetId: string,
    targetType: TargetType,
    baseUpvotes: number,
    baseDownvotes: number
  ) => { upvotes: number; downvotes: number }
  isLoading: boolean
}

const VotingContext = createContext<VotingContextValue | null>(null)

export function VotingProvider({ children }: { children: ReactNode }) {
  const [votes, setVotes] = useState<Record<string, VoteType>>({})
  const [initialVotes, setInitialVotes] = useState<Record<string, VoteType>>({})
  const [isLoading, setIsLoading] = useState(false)

  const loadAllVotes = useCallback(async () => {
    const user = await getCurrentUser()

    if (!user) {
      setVotes({})
      setInitialVotes({})
      return
    }

    try {
      const userVotes = await voteService.getUserVotes()
      const voteMap: Record<string, VoteType> = {}

      for (const vote of userVotes) {
        const key = `${normalizeType(vote.targetType as TargetType)}:${vote.targetId}`
        voteMap[key] = vote.voteType === 1 ? 'up' : 'down'
      }

      setVotes(voteMap)
      setInitialVotes(voteMap)
    } catch (err) {
      console.error('Failed to load votes:', err)
      setVotes({})
      setInitialVotes({})
    }
  }, [])

  useEffect(() => {
    loadAllVotes()
  }, [loadAllVotes])

  useAuthChangeListener(() => {
    loadAllVotes()
  })

  const toggleVote = useCallback(async (
    targetId: string,
    targetType: TargetType,
    voteType: VoteType
  ) => {
    const user = await getCurrentUser()
    if (!user) return

    if (!targetId) return

    const key = `${normalizeType(targetType)}:${targetId}`
    const previousVote = votes[key] || null
    
    // Intended new state
    const newVote = previousVote === voteType ? null : voteType
    
    // Optimistically update UI state
    setVotes(prev => ({ ...prev, [key]: newVote }))

    try {
      // Always send the value of the button clicked to the backend
      // Backend handles the toggle logic (if same value exists, delete it)
      await voteService.toggleVote({
        targetId,
        targetType: capitalizeType(targetType),
        voteType: voteType === 'up' ? 1 : -1
      })
    } catch (err) {
      console.error('Failed to save vote:', err)
      setVotes(prev => ({ ...prev, [key]: previousVote }))
    }
  }, [votes])

  const getDisplayVotes = useCallback((
    targetId: string,
    targetType: TargetType,
    baseUpvotes: number,
    baseDownvotes: number
  ) => {
    const key = `${normalizeType(targetType)}:${targetId}`
    const current = votes[key] || null
    const initial = initialVotes[key] || null

    if (current === initial) {
      return { upvotes: baseUpvotes, downvotes: baseDownvotes }
    }

    let up = baseUpvotes
    let down = baseDownvotes

    // Remove initial contribution
    if (initial === 'up') up -= 1
    if (initial === 'down') down -= 1

    // Add current contribution
    if (current === 'up') up += 1
    if (current === 'down') down += 1

    return { upvotes: Math.max(0, up), downvotes: Math.max(0, down) }
  }, [votes, initialVotes])

  return (
    <VotingContext.Provider value={{ votes, toggleVote, getDisplayVotes, isLoading }}>
      {children}
    </VotingContext.Provider>
  )
}

export function useVoting() {
  const context = useContext(VotingContext)
  if (!context) throw new Error('useVoting must be used within VotingProvider')
  return context
}
