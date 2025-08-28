export type PollOption = {
  id: string
  text: string
  votes: number
}

export type Poll = {
  id: string
  title: string
  description: string
  options: PollOption[]
  createdBy: string
  createdAt: string
  isActive: boolean
}