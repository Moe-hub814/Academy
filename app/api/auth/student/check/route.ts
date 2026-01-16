import { NextResponse } from 'next/server'
import { getStudentFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const studentToken = await getStudentFromCookies()
  
  if (!studentToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get full student data and verify subscription
  const { data: student, error } = await supabaseAdmin
    .from('students')
    .select('id, email, name, tier, subscription_status')
    .eq('id', studentToken.id)
    .single()

  if (error || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 401 })
  }

  // Check subscription status
  if (student.subscription_status === 'canceled') {
    return NextResponse.json({ error: 'Subscription canceled' }, { status: 403 })
  }

  if (student.subscription_status === 'past_due') {
    return NextResponse.json({ 
      error: 'Payment past due',
      pastDue: true 
    }, { status: 402 })
  }

  return NextResponse.json({ 
    authenticated: true,
    student: {
      id: student.id,
      email: student.email,
      name: student.name,
      tier: student.tier
    }
  })
}
