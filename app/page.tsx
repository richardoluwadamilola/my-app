'use client'

import { useRouter } from 'next/navigation'
import { Button } from '../components/ui/button'

export default function Home() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Polling App</h1>
      <p className="text-xl mb-8 max-w-2xl">Create polls, share with others, and gather responses in real-time.</p>
      
      <div className="flex gap-4">
        <Button onClick={() => router.push('/polls')} size="lg">
          View Polls
        </Button>
        <Button onClick={() => router.push('/polls/create')} variant="outline" size="lg">
          Create a Poll
        </Button>
      </div>
    </div>
  )
}
