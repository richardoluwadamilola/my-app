import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const createPollSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  options: z.array(z.string().trim().min(1, 'Option required')).min(2, 'At least two options'),
  isMultiple: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(true),
  closesAt: z.string().datetime().nullable().optional()
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parseResult = createPollSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', issues: parseResult.error.flatten() }, { status: 400 })
    }

    const { title, description, options, isMultiple, isPublic, closesAt } = parseResult.data

    // Capture Authorization header (if any) before creating the client
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    let bearerToken: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      bearerToken = authHeader.slice('Bearer '.length)
    }

    let cookiesToSet: { name: string; value: string; options?: any }[] = []
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookiesToSet = cookies
        },
      },
      global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    })

    // Get authenticated user
    const { data: { user }, error: userError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser()
    if (userError) {
      const res = NextResponse.json({ error: 'Auth error (Auth session missing!)', details: userError.message }, { status: 401 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }
    if (!user) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    // Insert poll into 'polls' table
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        author_id: user.id,
        is_multiple: Boolean(isMultiple),
        is_public: Boolean(isPublic),
        closes_at: closesAt ? new Date(closesAt).toISOString() : null
      })
      .select('*')
      .single()

    if (pollError || !poll) {
      const res = NextResponse.json({ error: pollError?.message ?? 'Failed to create poll', code: pollError?.code, details: (pollError as any)?.details }, { status: 500 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    // Deduplicate/normalize options (case-insensitive) and insert
    const normalized = options
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
    const seen = new Set<string>()
    const unique = normalized.filter((o) => {
      const key = o.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const optionRows = unique.map((label, idx) => ({ poll_id: poll.id, label, position: idx }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionRows)

    if (optionsError) {
      const res = NextResponse.json({ error: optionsError.message, code: optionsError.code, details: (optionsError as any)?.details }, { status: 400 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    const res = NextResponse.json({ pollId: poll.id }, { status: 201 })
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: err?.message ?? String(err) }, { status: 500 })
  }
}


