'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (res.status === 402) {
        // Payment past due
        setError('Your payment is past due. Please update your payment method to continue.')
        return
      }

      if (res.status === 403) {
        // Subscription canceled
        setError('Your subscription has been canceled. Please contact support to reactivate.')
        return
      }

      if (!res.ok) {
        setError(data.error || 'Invalid email or password')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 3rem;
          width: 100%;
          max-width: 420px;
        }
        .logo {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .logo-bracket {
          color: var(--accent-primary);
        }
        .subtitle {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 2rem;
        }
        .error {
          background: rgba(255, 77, 106, 0.1);
          border: 1px solid var(--danger);
          color: var(--danger);
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }
        .back-link {
          display: block;
          text-align: center;
          margin-top: 1.5rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .back-link:hover {
          color: var(--accent-primary);
        }
      `}</style>

      <div className="login-card">
        <div className="logo">
          <span className="logo-bracket">[</span>
          Cybermoe_
          <span className="logo-bracket">]</span>
        </div>
        <p className="subtitle">Student Portal</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <Link href="/" className="back-link">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  )
}
