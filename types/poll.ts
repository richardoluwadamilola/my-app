// Database row types
export type PollRow = {
  id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
  closes_at: string | null
  is_multiple: boolean
  is_public: boolean
  author_id: string
}

export type PollOptionRow = {
  id: string
  poll_id: string
  label: string
  position: number
  created_at: string
}

export type VoteRow = {
  id: string
  poll_id: string
  option_id: string
  user_id: string
  created_at: string
}

// Form types - aligned with Zod schema
export type PollFormValues = {
  title: string
  description?: string
  isMultiple?: boolean
  isPublic?: boolean
  closesAt?: string
  options: Array<{ value: string }>
}

// API request/response types
export type CreatePollRequest = {
  title: string
  description: string
  options: string[]
  isMultiple?: boolean
  isPublic?: boolean
  closesAt?: string | null
}

export type UpdatePollRequest = Partial<CreatePollRequest>

export type VoteRequest = {
  optionId: string
}

// Component props types
export type PollWithOptions = PollRow & {
  options: PollOptionRow[]
}

export type PollWithVoteCounts = PollRow & {
  options: (PollOptionRow & { vote_count: number })[]
  total_votes: number
}