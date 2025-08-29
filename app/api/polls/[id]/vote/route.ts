import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const voteSchema = z.object({
  optionId: z.string().uuid(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const pollId = params.id
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    let cookiesToSet: { name: string; value: string; options?: any }[] = []

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(c) { cookiesToSet = c },
      },
      global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    })

    const body = await request.json().catch(() => ({}))
    const parsed = voteSchema.safeParse(body)
    if (!parsed.success) {
      const res = NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }
    const { optionId } = parsed.data

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      const res = NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    // Optional: validate option belongs to poll (trigger also enforces)
    const { data: belongs, error: belongsError } = await supabase
      .from('poll_options')
      .select('id, poll_id')
      .eq('id', optionId)
      .eq('poll_id', pollId)
      .maybeSingle()
    if (belongsError) {
      const res = NextResponse.json({ error: belongsError.message }, { status: 400 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }
    if (!belongs) {
      const res = NextResponse.json({ error: 'Option does not belong to this poll' }, { status: 400 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    const { error: insertError } = await supabase
      .from('votes')
      .insert({ poll_id: pollId, option_id: optionId, user_id: user.id })

    if (insertError) {
      const res = NextResponse.json({ error: insertError.message, code: insertError.code }, { status: 400 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    const res = NextResponse.json({ ok: true }, { status: 201 })
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: err?.message ?? String(err) }, { status: 500 })
  }
}


