'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import type { Poll } from '../../../types/poll'

// Mock data for polls (same as in the polls list page)
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

export default function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use() to unwrap the params Promise
  const { id } = React.use(params)
  const router = useRouter()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [totalVotes, setTotalVotes] = useState(0)

  useEffect(() => {
    // Simulate API fetch with a delay
    const fetchPoll = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const foundPoll = mockPolls.find(p => p.id === id)
          if (foundPoll) {
            setPoll(foundPoll)
            setTotalVotes(foundPoll.options.reduce((sum, option) => sum + option.votes, 0))
          }
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error('Failed to fetch poll:', error)
        setIsLoading(false)
      }
    }

    fetchPoll()
  }, [id])

  const handleVote = () => {
    if (!poll || !selectedOption) return

    // Update the poll with the new vote
    const updatedOptions = poll.options.map(option => {
      if (option.id === selectedOption) {
        return { ...option, votes: option.votes + 1 }
      }
      return option
    })

    const updatedPoll = { ...poll, options: updatedOptions }
    setPoll(updatedPoll)
    setHasVoted(true)
    setTotalVotes(totalVotes + 1)

    // In a real app, you would send this vote to your API
    console.log('Vote submitted for option:', selectedOption)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Loading poll...</p>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Poll Not Found</h1>
        <p className="text-muted-foreground mb-6">The poll you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push('/polls')}>Back to Polls</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => router.push('/polls')} 
        className="mb-6"
      >
        ← Back to Polls
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>
            Created on {new Date(poll.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p>{poll.description}</p>
          
          <div className="space-y-4">
            {poll.options.map((option) => {
              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
              
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {!hasVoted && (
                      <input
                        type="radio"
                        id={option.id}
                        name="poll-option"
                        checked={selectedOption === option.id}
                        onChange={() => setSelectedOption(option.id)}
                        className="h-4 w-4"
                      />
                    )}
                    <label 
                      htmlFor={option.id} 
                      className={`flex-grow ${hasVoted ? 'font-medium' : ''}`}
                    >
                      {option.text}
                    </label>
                    {hasVoted && (
                      <span className="text-sm font-medium">
                        {percentage}% ({option.votes} votes)
                      </span>
                    )}
                  </div>
                  
                  {hasVoted && (
                    <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
        
        <CardFooter>
          {!hasVoted ? (
            <Button 
              onClick={handleVote} 
              disabled={!selectedOption}
              className="w-full"
            >
              Submit Vote
            </Button>
          ) : (
            <p className="text-center w-full text-sm text-muted-foreground">
              Thank you for voting! Total votes: {totalVotes}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}