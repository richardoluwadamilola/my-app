import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '../../../lib/supabase-server'

const createPollSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters')
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parseResult = createPollSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', issues: parseResult.error.flatten() }, { status: 400 })
    }

    const { title, description } = parseResult.data

    const supabase = await createSupabaseServerClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      return NextResponse.json({ error: 'Auth error' }, { status: 401 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Insert poll into 'polls' table
    const { data, error } = await supabase
      .from('polls')
      .insert({ title, description, created_by: user.id })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ poll: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


