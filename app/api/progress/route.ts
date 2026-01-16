import { NextRequest, NextResponse } from 'next/server'
import { getStudentFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/progress - Get current student's progress
export async function GET() {
  const student = await getStudentFromCookies()
  if (!student) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: progress, error } = await supabaseAdmin
    .from('progress')
    .select('*')
    .eq('student_id', student.id)
    .order('module_number')

  if (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }

  const completedCount = progress?.filter(p => p.completed).length || 0

  return NextResponse.json({
    modules: progress,
    completed: completedCount,
    total: 8,
    percent: Math.round((completedCount / 8) * 100)
  })
}

// PATCH /api/progress - Update module progress
export async function PATCH(req: NextRequest) {
  const student = await getStudentFromCookies()
  if (!student) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify subscription is active
  const { data: studentData } = await supabaseAdmin
    .from('students')
    .select('subscription_status')
    .eq('id', student.id)
    .single()

  if (studentData?.subscription_status !== 'active') {
    return NextResponse.json(
      { error: 'Your subscription is not active' },
      { status: 403 }
    )
  }

  const { moduleNumber, completed, timeSpent } = await req.json()

  if (!moduleNumber || moduleNumber < 1 || moduleNumber > 8) {
    return NextResponse.json(
      { error: 'Invalid module number' },
      { status: 400 }
    )
  }

  const updates: Record<string, any> = {}

  if (completed !== undefined) {
    updates.completed = completed
    if (completed) {
      updates.completed_at = new Date().toISOString()
    } else {
      updates.completed_at = null
    }
  }

  if (timeSpent !== undefined) {
    // Increment time spent
    const { data: current } = await supabaseAdmin
      .from('progress')
      .select('time_spent_minutes')
      .eq('student_id', student.id)
      .eq('module_number', moduleNumber)
      .single()

    updates.time_spent_minutes = (current?.time_spent_minutes || 0) + timeSpent
  }

  const { error } = await supabaseAdmin
    .from('progress')
    .update(updates)
    .eq('student_id', student.id)
    .eq('module_number', moduleNumber)

  if (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
