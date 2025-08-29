'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, type ControllerRenderProps } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { useState } from 'react'
import { createBrowserClient } from '../../../lib/supabase'

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  options: z.array(z.object({ value: z.string().min(1, 'Required') })).min(2, 'At least two options'),
  isMultiple: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(true),
  closesAt: z.string().optional()
})

type FormValues = z.input<typeof formSchema>

export default function CreatePollPage() {
  const router = useRouter()
  const [apiError, setApiError] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', description: '', options: [{ value: '' }, { value: '' }], isMultiple: false, isPublic: true, closesAt: '' },
  })
  const { fields, append, remove } = useFieldArray({ name: 'options', control: form.control })
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setApiError('')
    const payload = {
      title: values.title,
      description: values.description,
      options: values.options.map(o => o.value).filter(Boolean),
      isMultiple: values.isMultiple,
      isPublic: values.isPublic,
      closesAt: values.closesAt ? new Date(values.closesAt).toISOString() : null,
    }

    try {
      // Include auth token to help the API identify the user if cookies fail
      const supabase = createBrowserClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      if (!response.ok) {
        let message = 'Failed to create poll'
        try {
          const data = await response.json()
          if (data?.error) message = data.error
          if (data?.details) message += ` (${data.details})`
          if (data?.code) message += ` [${data.code}]`
        } catch {
          const text = await response.text().catch(() => '')
          if (text) message = text
        }
        if (response.status === 401) {
          message = message || 'Unauthorized'
          message += ' — please log in to create a poll.'
        }
        setApiError(message)
        setSubmitting(false)
        return
      }

      setSuccessMsg('Poll created successfully!')
      setTimeout(() => router.push('/polls'), 1200)
    } catch (e) {
      setApiError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create a New Poll</h1>

      {apiError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Poll Details</CardTitle>
          <CardDescription>Fill in the information for your new poll</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'title'> }) => (
                  <FormItem>
                    <FormLabel>Poll Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a clear, specific question" {...field} />
                    </FormControl>
                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'description'> }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide context or additional information about your poll" {...field} />
                    </FormControl>
                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              {form.formState.errors.root?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Options</FormLabel>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          {...form.register(`options.${index}.value` as const)}
                        />
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
                  <Button type="button" variant="outline" onClick={() => router.push('/polls')}>Cancel</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting || submitting}>
                    {form.formState.isSubmitting || submitting ? 'Creating...' : 'Create Poll'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="hidden" />
      </Card>
    </div>
  )
}


