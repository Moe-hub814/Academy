import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (limited permissions)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side Supabase client (full permissions - use only in API routes)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Database Types
export interface Student {
  id: string
  email: string
  name: string
  tier: 'self-paced' | 'mentorship'
  subscription_status: 'active' | 'past_due' | 'canceled' | 'pending'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface Progress {
  id: string
  student_id: string
  module_number: number
  completed: boolean
  completed_at: string | null
  time_spent_minutes: number
}

export interface PaymentHistory {
  id: string
  student_id: string
  stripe_payment_id: string
  amount: number
  status: 'succeeded' | 'failed' | 'pending' | 'refunded'
  description: string
  created_at: string
}
