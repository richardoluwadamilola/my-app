
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { createBrowserClient } from '../../../lib/supabase'
import Link from 'next/link'
import { useAuth } from '../../../components/AuthProvider'

type PollRow = {
  id: string
  title: string
  description: string | null
  created_at: string
  closes_at: string | null
}

type OptionRow = {
  id: string
  label: string
}

export default function PollDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { user } = useAuth()
  const [poll, setPoll] = useState<PollRow | null>(null)
  const [options, setOptions] = useState<OptionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string>('')

  useEffect(() => {
    const fetchPoll = async () => {
      if (!id) return
      setIsLoading(true)
      setError('')
      try {
        const supabase = createBrowserClient()
        const [{ data: pollData, error: pollError }, { data: optionsData, error: optionsError }] = await Promise.all([
          supabase.from('polls').select('id, title, description, created_at, closes_at').eq('id', id).maybeSingle(),
          supabase.from('poll_options').select('id, label').eq('poll_id', id).order('position', { ascending: true }),
        ])

        if (pollError) {
          setError(pollError.message)
        } else if (!pollData) {
          setPoll(null)
        } else {
          setPoll(pollData)
          setOptions(optionsData ?? [])
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to fetch poll')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPoll()
  }, [id])

  const handleVote = async () => {
    if (!poll || !selectedOption) return
    setError('')
    setSuccessMsg('')
    try {
      const supabase = createBrowserClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/polls/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ optionId: selectedOption }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? 'Failed to submit vote')
        return
      }
      setSuccessMsg('Vote submitted! Redirecting...')
      setTimeout(() => router.push('/polls'), 1200)
    } catch (e: any) {
      setError(e?.message ?? 'Network error')
    }
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
      
      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>
            Created on {new Date(poll.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p>{poll.description}</p>

          <div className="space-y-3">
            {options.map((option) => (
              <label key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="poll-option"
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="h-4 w-4"
                />
                <span>{option.label}</span>
              </label>
            ))}
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground">No options found for this poll.</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2">
          {user?.id && (
            <Link href={`/polls/${id}/edit`} className="flex-1">
              <Button variant="outline" className="w-full">Edit</Button>
            </Link>
          )}
          {poll?.closes_at && new Date(poll.closes_at) <= new Date() ? (
            <span className="text-sm text-muted-foreground self-center">Poll closed</span>
          ) : (
            <Button 
              onClick={handleVote} 
              disabled={!selectedOption}
              className="flex-1"
            >
              Submit Vote
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}