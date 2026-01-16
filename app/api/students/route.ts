import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/students - List all students
export async function GET(req: NextRequest) {
  const admin = await getAdminFromCookies()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const search = searchParams.get('search')
  const tier = searchParams.get('tier')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  let query = supabaseAdmin
    .from('students')
    .select('*, progress(*)', { count: 'exact' })

  // Apply filters
  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }
  if (tier && tier !== 'all') {
    query = query.eq('tier', tier)
  }
  if (status && status !== 'all') {
    query = query.eq('subscription_status', status)
  }

  // Pagination
  const from = (page - 1) * limit
  query = query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  const { data: students, error, count } = await query

  if (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }

  // Calculate progress for each student
  const studentsWithProgress = students?.map(student => {
    const completedModules = student.progress?.filter((p: any) => p.completed).length || 0
    return {
      ...student,
      progress_percent: Math.round((completedModules / 8) * 100),
      modules_completed: completedModules
    }
  })

  return NextResponse.json({
    students: studentsWithProgress,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  })
}

// POST /api/students - Create a new student (manual enrollment)
export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, name, tier, password } = await req.json()

    if (!email || !name || !tier) {
      return NextResponse.json(
        { error: 'Email, name, and tier are required' },
        { status: 400 }
      )
    }

    // Check if student already exists
    const { data: existing } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A student with this email already exists' },
        { status: 409 }
      )
    }

    // Import here to avoid circular dependency
    const { createStudentAccount, generateRandomPassword } = await import('@/lib/auth')
    
    // Generate password if not provided
    const studentPassword = password || await generateRandomPassword()

    const student = await createStudentAccount(
      email,
      name,
      studentPassword,
      tier
    )

    if (!student) {
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      student,
      temporaryPassword: password ? undefined : studentPassword
    })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
