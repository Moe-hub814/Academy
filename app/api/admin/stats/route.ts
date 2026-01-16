import { NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const admin = await getAdminFromCookies()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get total students
  const { count: totalStudents } = await supabaseAdmin
    .from('students')
    .select('*', { count: 'exact', head: true })

  // Get active students
  const { count: activeStudents } = await supabaseAdmin
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  // Get past due students
  const { count: pastDueStudents } = await supabaseAdmin
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'past_due')

  // Get tier breakdown
  const { count: selfPacedCount } = await supabaseAdmin
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tier', 'self-paced')
    .neq('subscription_status', 'canceled')

  const { count: mentorshipCount } = await supabaseAdmin
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tier', 'mentorship')
    .neq('subscription_status', 'canceled')

  // Get recent signups
  const { data: recentSignups } = await supabaseAdmin
    .from('students')
    .select('id, name, email, tier, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    totalStudents: totalStudents || 0,
    activeStudents: activeStudents || 0,
    pastDueStudents: pastDueStudents || 0,
    selfPacedCount: selfPacedCount || 0,
    mentorshipCount: mentorshipCount || 0,
    recentSignups: recentSignups || []
  })
}
