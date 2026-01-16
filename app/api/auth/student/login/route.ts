import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, createStudentToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const student = await authenticateStudent(email, password)

    if (!student) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check subscription status
    if (student.subscription_status === 'canceled') {
      return NextResponse.json(
        { error: 'Your subscription has been canceled. Please contact support.' },
        { status: 403 }
      )
    }

    if (student.subscription_status === 'past_due') {
      return NextResponse.json(
        { 
          error: 'Your payment is past due. Please update your payment method.',
          pastDue: true,
          stripeCustomerId: student.stripe_customer_id
        },
        { status: 402 }
      )
    }

    // Create JWT token
    const token = await createStudentToken(student)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('student_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        email: student.email,
        name: student.name,
        tier: student.tier
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
