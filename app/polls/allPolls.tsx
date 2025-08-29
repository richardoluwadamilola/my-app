
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { createBrowserClient } from '../../lib/supabase'
import { useAuth } from '../../components/AuthProvider'

type PollRow = {
  id: string
  title: string
  description: string | null
  created_at: string
}

export default function PollsPage() {
  const [polls, setPolls] = useState<PollRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => {
    const fetchPolls = async () => {
      setIsLoading(true)
      setError('')
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from('polls')
          .select('id, title, description, created_at, author_id')
          .order('created_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          setPolls(data ?? [])
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to fetch polls')
      } finally {
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

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {polls.length === 0 && !error ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No polls available. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <Card key={poll.id} className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{poll.title}</CardTitle>
                <CardDescription>
                  Created {new Date(poll.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2">{poll.description}</p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Link href={`/polls/${poll.id}`} className="flex-1">
                  <Button className="w-full" variant="default">View Details</Button>
                </Link>
                {user?.id === (poll as any).author_id && (
                  <Link href={`/polls/${poll.id}/edit`}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                )}
                {user?.id === (poll as any).author_id && (
                  <Button
                    variant="destructive"
                    onClick={async (e) => {
                      e.preventDefault()
                      if (!confirm('Delete this poll? This cannot be undone.')) return
                      try {
                        const supabase = createBrowserClient()
                        const { data: sessionData } = await supabase.auth.getSession()
                        const token = sessionData?.session?.access_token
                        const res = await fetch(`/api/polls/${poll.id}`, {
                          method: 'DELETE',
                          headers: {
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          credentials: 'include',
                        })
                        if (!res.ok) {
                          const body = await res.json().catch(() => ({}))
                          alert(body?.error ?? 'Failed to delete poll')
                          return
                        }
                        setPolls((prev) => prev.filter((p) => p.id !== poll.id))
                      } catch (err) {
                        alert('Network error. Please try again.')
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}