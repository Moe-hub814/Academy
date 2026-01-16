-- =============================================
-- CYBERMOE ACADEMY DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('self-paced', 'mentorship')),
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'pending')),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Progress tracking table
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 8),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER DEFAULT 0,
  UNIQUE(student_id, module_number)
);

-- Payment history table
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pending enrollments (for Stripe webhook -> account creation flow)
CREATE TABLE pending_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('self-paced', 'mentorship')),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_stripe_customer ON students(stripe_customer_id);
CREATE INDEX idx_students_status ON students(subscription_status);
CREATE INDEX idx_progress_student ON progress(student_id);
CREATE INDEX idx_payment_history_student ON payment_history(student_id);

-- Row Level Security (RLS) policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_enrollments ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access to students" ON students
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to progress" ON progress
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to payment_history" ON payment_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to pending_enrollments" ON pending_enrollments
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- VIEWS FOR ADMIN DASHBOARD
-- =============================================

CREATE OR REPLACE VIEW admin_student_summary AS
SELECT 
  s.id,
  s.email,
  s.name,
  s.tier,
  s.subscription_status,
  s.created_at,
  s.last_login,
  COUNT(CASE WHEN p.completed THEN 1 END) as modules_completed,
  ROUND(COUNT(CASE WHEN p.completed THEN 1 END)::numeric / 8 * 100) as progress_percent
FROM students s
LEFT JOIN progress p ON s.id = p.student_id
GROUP BY s.id, s.email, s.name, s.tier, s.subscription_status, s.created_at, s.last_login;

-- =============================================
-- SAMPLE DATA FOR TESTING (Optional)
-- =============================================

-- Uncomment to insert test data:
-- INSERT INTO students (email, name, password_hash, tier, subscription_status)
-- VALUES ('test@example.com', 'Test Student', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.H/6Z8vN5Yw5LHS', 'self-paced', 'active');
-- Note: The password hash above is for 'password123' - generate your own with bcrypt
