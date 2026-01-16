import * as jose from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabaseAdmin, Student } from './supabase'

const getJWTSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me')

// Token expiration times
const STUDENT_TOKEN_EXPIRY = '7d'
const ADMIN_TOKEN_EXPIRY = '24h'

// ============================================
// STUDENT AUTHENTICATION
// ============================================

export async function createStudentToken(student: Student): Promise<string> {
  return new jose.SignJWT({
    id: student.id,
    email: student.email,
    name: student.name,
    tier: student.tier,
    type: 'student'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(STUDENT_TOKEN_EXPIRY)
    .sign(getJWTSecret())
}

export async function verifyStudentToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret())
    if (payload.type !== 'student') return null
    return payload as { id: string; email: string; name: string; tier: string; type: string }
  } catch {
    return null
  }
}

export async function getStudentFromCookies() {
  const cookieStore = await cookies()
  const token = cookieStore.get('student_token')?.value
  if (!token) return null
  return verifyStudentToken(token)
}

export async function authenticateStudent(email: string, password: string): Promise<Student | null> {
  // Get student from database
  const { data: student, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !student) return null

  // Verify password
  const passwordMatch = await bcrypt.compare(password, student.password_hash)
  if (!passwordMatch) return null

  // Check subscription status
  if (student.subscription_status === 'canceled') return null

  // Update last login
  await supabaseAdmin
    .from('students')
    .update({ last_login: new Date().toISOString() })
    .eq('id', student.id)

  return student
}

export async function createStudentAccount(
  email: string,
  name: string,
  password: string,
  tier: 'self-paced' | 'mentorship',
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<Student | null> {
  const passwordHash = await bcrypt.hash(password, 12)

  const { data: student, error } = await supabaseAdmin
    .from('students')
    .insert({
      email: email.toLowerCase(),
      name,
      password_hash: passwordHash,
      tier,
      subscription_status: 'active',
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating student:', error)
    return null
  }

  // Initialize progress records for all 8 modules
  const progressRecords = Array.from({ length: 8 }, (_, i) => ({
    student_id: student.id,
    module_number: i + 1,
    completed: false,
    time_spent_minutes: 0
  }))

  await supabaseAdmin.from('progress').insert(progressRecords)

  return student
}

// ============================================
// ADMIN AUTHENTICATION
// ============================================

export async function createAdminToken(): Promise<string> {
  return new jose.SignJWT({
    role: 'admin',
    type: 'admin'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_EXPIRY)
    .sign(getJWTSecret())
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret())
    if (payload.type !== 'admin') return null
    return payload as { role: string; type: string }
  } catch {
    return null
  }
}

export async function getAdminFromCookies() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export async function authenticateAdmin(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

  if (!adminEmail || !adminPasswordHash) return false
  if (email.toLowerCase() !== adminEmail.toLowerCase()) return false

  return bcrypt.compare(password, adminPasswordHash)
}

// ============================================
// PASSWORD UTILITIES
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function generateRandomPassword(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
