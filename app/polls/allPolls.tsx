'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import type { Poll } from '../../types/poll'

// Mock data for polls
const mockPolls: Poll[] = [
  {
    id: '1',
    title: 'Favorite Programming Language',
    description: 'What programming language do you prefer to work with?',
    options: [
      { id: '1-1', text: 'JavaScript', votes: 42 },
      { id: '1-2', text: 'Python', votes: 38 },
      { id: '1-3', text: 'Java', votes: 25 },
      { id: '1-4', text: 'C#', votes: 18 }
    ],
    createdBy: 'user1',
    createdAt: '2023-06-15T10:30:00Z',
    isActive: true
  },
  {
    id: '2',
    title: 'Best Frontend Framework',
    description: 'Which frontend framework do you prefer?',
    options: [
      { id: '2-1', text: 'React', votes: 56 },
      { id: '2-2', text: 'Vue', votes: 34 },
      { id: '2-3', text: 'Angular', votes: 29 },
      { id: '2-4', text: 'Svelte', votes: 22 }
    ],
    createdBy: 'user2',
    createdAt: '2023-06-18T14:45:00Z',
    isActive: true
  }
]

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch with a delay
    const fetchPolls = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          setPolls(mockPolls)
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error('Failed to fetch polls:', error)
        setIsLoading(false)
      }
    }

    fetchPolls()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Loading polls...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Available Polls</h1>
        <Link href="/polls/create">
          <Button>Create New Poll</Button>
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No polls available. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <Link href={`/polls/${poll.id}`} key={poll.id} className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  <CardDescription>
                    Created {new Date(poll.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2">{poll.description}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {poll.options.length} options • {poll.options.reduce((sum, option) => sum + option.votes, 0)} votes
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Details</Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}