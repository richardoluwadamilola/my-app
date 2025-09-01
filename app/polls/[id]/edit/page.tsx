'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../components/ui/form'
import { createBrowserClient } from '../../../../lib/supabase'
import type { PollFormValues } from '../../../../types/poll'

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional().default(''),
  isMultiple: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(true),
  closesAt: z.string().optional().default(''),
  options: z.array(z.object({ value: z.string().min(1) })).min(2),
})

export default function EditPollPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const form = useForm<PollFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', isMultiple: false, isPublic: true, closesAt: '', options: [{ value: '' }, { value: '' }] },
  })
  const { fields, append, remove } = useFieldArray({ name: 'options', control: form.control })
  const [apiError, setApiError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const supabase = createBrowserClient()
      const [{ data: poll, error: pollErr }, { data: opts, error: optErr }] = await Promise.all([
        supabase.from('polls').select('title, description, is_multiple, is_public, closes_at').eq('id', id).maybeSingle(),
        supabase.from('poll_options').select('label').eq('poll_id', id).order('position', { ascending: true }),
      ])
      if (pollErr || optErr) {
        setApiError(pollErr?.message ?? optErr?.message ?? 'Failed to load poll')
        return
      }
      if (!poll) {
        setApiError('Poll not found')
        return
      }
      const pollData = poll as any
      form.reset({
        title: pollData.title,
        description: pollData.description ?? '',
        isMultiple: pollData.is_multiple ?? false,
        isPublic: pollData.is_public ?? true,
        closesAt: pollData.closes_at ? new Date(pollData.closes_at).toISOString().slice(0,16) : '',
        options: (opts ?? []).map((o: any) => ({ value: o.label })),
      })
    }
    load()
  }, [id, form])

  const onSubmit = async (values: PollFormValues) => {
    setApiError('')
    setSuccessMsg('')
    try {
      const supabase = createBrowserClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/polls/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          isMultiple: values.isMultiple,
          isPublic: values.isPublic,
          closesAt: values.closesAt ? new Date(values.closesAt).toISOString() : null,
          options: values.options.map(o => o.value),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setApiError(body?.error ?? 'Failed to update poll')
        return
      }
      setSuccessMsg('Poll updated successfully!')
      setTimeout(() => router.push(`/polls`), 1200)
    } catch (e: any) {
      setApiError(e?.message ?? 'Network error')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Poll</h1>
      {apiError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{apiError}</div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Update Poll</CardTitle>
          <CardDescription>Change details and options</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Options</FormLabel>
                <div className="space-y-2">
                  {fields.map((f, index) => (
                    <div key={f.id} className="flex gap-2 items-center">
                      <Input {...form.register(`options.${index}.value` as const)} />
                      {fields.length > 2 && (
                        <Button type="button" variant="ghost" onClick={() => remove(index)} className="shrink-0">✕</Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={() => append({ value: '' })}>Add Option</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.watch('isMultiple')} onChange={(e) => form.setValue('isMultiple', e.target.checked)} />
                  Allow multiple selections
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.watch('isPublic')} onChange={(e) => form.setValue('isPublic', e.target.checked)} />
                  Public poll
                </label>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-sm">Closes at</FormLabel>
                  <Input type="datetime-local" value={form.watch('closesAt')}
                    onChange={(e) => form.setValue('closesAt', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/polls/${id}`)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="hidden" />
      </Card>
    </div>
  )
}


