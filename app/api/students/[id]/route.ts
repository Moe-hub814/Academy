import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { cancelStudentSubscription } from '@/lib/stripe'

// GET /api/students/[id] - Get single student details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: student, error } = await supabaseAdmin
    .from('students')
    .select('*, progress(*), payment_history(*)')
    .eq('id', id)
    .single()

  if (error || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Calculate progress
  const completedModules = student.progress?.filter((p: any) => p.completed).length || 0

  return NextResponse.json({
    ...student,
    progress_percent: Math.round((completedModules / 8) * 100),
    modules_completed: completedModules
  })
}

// PATCH /api/students/[id] - Update student
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const updates = await req.json()

  // Only allow certain fields to be updated
  const allowedUpdates = ['name', 'tier', 'subscription_status']
  const filteredUpdates: Record<string, any> = {}
  
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key]
    }
  }

  filteredUpdates.updated_at = new Date().toISOString()

  const { data: student, error } = await supabaseAdmin
    .from('students')
    .update(filteredUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }

  return NextResponse.json({ success: true, student })
}

// DELETE /api/students/[id] - Delete student (revoke access)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const searchParams = req.nextUrl.searchParams
  const cancelStripe = searchParams.get('cancelStripe') === 'true'

  // Get student first
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('stripe_subscription_id')
    .eq('id', id)
    .single()

  // Cancel Stripe subscription if requested
  if (cancelStripe && student?.stripe_subscription_id) {
    try {
      await cancelStudentSubscription(student.stripe_subscription_id)
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error)
    }
  }

  // Update status to canceled (soft delete)
  const { error } = await supabaseAdmin
    .from('students')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error revoking student access:', error)
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
