import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const pollId = params.id
  try {
    // Forward Authorization header so PostgREST evaluates RLS with the user
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
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

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      const res = NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    // Attempt delete (RLS enforces ownership). Adding filter for clearer behavior.
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)
      .eq('author_id', user.id)

    if (error) {
      const res = NextResponse.json({ error: error.message, code: error.code, details: (error as any)?.details }, { status: 400 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    const res = new NextResponse(null, { status: 204 })
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: err?.message ?? String(err) }, { status: 500 })
  }
}

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(0).nullable().optional(),
  isMultiple: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  closesAt: z.string().datetime().nullable().optional(),
  options: z.array(z.string().trim().min(1)).min(2).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      const res = NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      const res = NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 })
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    const updates: any = {}
    if (parsed.data.title !== undefined) updates.title = parsed.data.title
    if (parsed.data.description !== undefined) updates.description = parsed.data.description
    if (parsed.data.isMultiple !== undefined) updates.is_multiple = parsed.data.isMultiple
    if (parsed.data.isPublic !== undefined) updates.is_public = parsed.data.isPublic
    if (parsed.data.closesAt !== undefined) updates.closes_at = parsed.data.closesAt

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await supabase
        .from('polls')
        .update(updates)
        .eq('id', pollId)
        .eq('author_id', user.id)
      if (updErr) {
        const res = NextResponse.json({ error: updErr.message, code: updErr.code }, { status: 400 })
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        return res
      }
    }

    if (parsed.data.options) {
      const normalized = parsed.data.options.map(o => o.trim()).filter(Boolean)
      const seen = new Set<string>()
      const unique = normalized.filter(o => { const k = o.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })

      // Replace options: delete then insert
      const { error: delErr } = await supabase.from('poll_options').delete().eq('poll_id', pollId)
      if (delErr) {
        const res = NextResponse.json({ error: delErr.message, code: delErr.code }, { status: 400 })
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        return res
      }

      const rows = unique.map((label, idx) => ({ poll_id: pollId, label, position: idx }))
      const { error: insErr } = await supabase.from('poll_options').insert(rows)
      if (insErr) {
        const res = NextResponse.json({ error: insErr.message, code: insErr.code }, { status: 400 })
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        return res
      }
    }

    const res = NextResponse.json({ ok: true }, { status: 200 })
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: err?.message ?? String(err) }, { status: 500 })
  }
}


