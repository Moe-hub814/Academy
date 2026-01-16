'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface StudentDetail {
  id: string
  name: string
  email: string
  tier: 'self-paced' | 'mentorship'
  subscription_status: 'active' | 'past_due' | 'canceled' | 'pending'
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
  last_login: string | null
  progress: Array<{
    module_number: number
    completed: boolean
    completed_at: string | null
    time_spent_minutes: number
  }>
  payment_history: Array<{
    id: string
    amount: number
    status: string
    description: string
    created_at: string
  }>
  progress_percent: number
  modules_completed: number
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchStudent()
    }
  }, [params.id])

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${params.id}`)
      if (!res.ok) throw new Error('Student not found')
      const data = await res.json()
      setStudent(data)
    } catch (error) {
      console.error('Error fetching student:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/students/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_status: newStatus })
      })
      if (res.ok) {
        fetchStudent()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeAccess = async (cancelStripe: boolean) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/students/${params.id}?cancelStripe=${cancelStripe}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        router.push('/admin/students')
      }
    } catch (error) {
      console.error('Error revoking access:', error)
    } finally {
      setActionLoading(false)
      setShowRevokeModal(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="empty-state">
        <h2>Student not found</h2>
        <Link href="/admin/students">← Back to Students</Link>
      </div>
    )
  }

  const moduleNames = [
    'Federal Cybersecurity Fundamentals',
    'Risk Management Framework (RMF) Deep Dive',
    'Security Assessment & Authorization (SA&A)',
    'Vulnerability Management & ACAS',
    'Plan of Action & Milestones (POA&M)',
    'Continuous Monitoring & ConMon',
    'FedRAMP & Cloud Security',
    'Career Development & Interview Prep'
  ]

  return (
    <div className="student-detail">
      <style jsx>{`
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }
        .back-link:hover {
          color: var(--accent-primary);
        }
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .student-info h1 {
          margin-bottom: 0.25rem;
        }
        .student-email {
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }
        .badges {
          display: flex;
          gap: 0.5rem;
        }
        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }
        .section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .section-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          font-weight: 600;
        }
        .section-content {
          padding: 1.25rem;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .info-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .info-value {
          font-weight: 500;
        }
        .progress-overview {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }
        .progress-ring {
          width: 100px;
          height: 100px;
          position: relative;
        }
        .progress-ring svg {
          transform: rotate(-90deg);
        }
        .progress-ring-bg {
          fill: none;
          stroke: var(--bg-secondary);
          stroke-width: 8;
        }
        .progress-ring-fill {
          fill: none;
          stroke: var(--accent-primary);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }
        .progress-ring-text {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 600;
        }
        .module-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .module-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border-radius: 6px;
        }
        .module-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .module-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card);
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 600;
        }
        .module-status {
          font-size: 0.875rem;
        }
        .module-status.completed {
          color: var(--success);
        }
        .module-status.pending {
          color: var(--text-muted);
        }
        .payment-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        .payment-item:last-child {
          border-bottom: none;
        }
        .payment-amount {
          font-weight: 600;
          font-family: var(--font-mono);
        }
        .payment-date {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .status-select {
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-primary);
          font-family: var(--font-display);
          cursor: pointer;
        }
      `}</style>

      <Link href="/admin/students" className="back-link">
        ← Back to Students
      </Link>

      <div className="header">
        <div className="student-info">
          <h1>{student.name}</h1>
          <p className="student-email">{student.email}</p>
          <div className="badges">
            <span className={`badge badge-${student.tier}`}>{student.tier}</span>
            <span className={`badge badge-${student.subscription_status.replace('_', '-')}`}>
              {student.subscription_status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="action-buttons">
          <select
            className="status-select"
            value={student.subscription_status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={actionLoading}
          >
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
          <button
            className="btn btn-danger"
            onClick={() => setShowRevokeModal(true)}
            disabled={student.subscription_status === 'canceled'}
          >
            Revoke Access
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-header">Account Details</div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Joined</span>
              <span className="info-value">
                {new Date(student.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Login</span>
              <span className="info-value">
                {student.last_login
                  ? new Date(student.last_login).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Never'
                }
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Stripe Customer ID</span>
              <span className="info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                {student.stripe_customer_id || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">Course Progress</div>
        <div className="section-content">
          <div className="progress-overview">
            <div className="progress-ring">
              <svg viewBox="0 0 100 100">
                <circle className="progress-ring-bg" cx="50" cy="50" r="42" />
                <circle
                  className="progress-ring-fill"
                  cx="50"
                  cy="50"
                  r="42"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - student.progress_percent / 100)}`}
                />
              </svg>
              <div className="progress-ring-text">{student.progress_percent}%</div>
            </div>
            <div>
              <h3>{student.modules_completed} of 8 modules completed</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {student.progress?.reduce((acc, p) => acc + p.time_spent_minutes, 0) || 0} minutes total time
              </p>
            </div>
          </div>

          <div className="module-list">
            {student.progress?.sort((a, b) => a.module_number - b.module_number).map((progress) => (
              <div key={progress.module_number} className="module-item">
                <div className="module-name">
                  <span className="module-number">{progress.module_number}</span>
                  <span>{moduleNames[progress.module_number - 1]}</span>
                </div>
                <span className={`module-status ${progress.completed ? 'completed' : 'pending'}`}>
                  {progress.completed ? '✓ Completed' : 'In Progress'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">Payment History</div>
        <div className="section-content">
          {student.payment_history && student.payment_history.length > 0 ? (
            student.payment_history.map((payment) => (
              <div key={payment.id} className="payment-item">
                <div>
                  <span className="payment-amount">${payment.amount.toFixed(2)}</span>
                  <span className={`badge badge-${payment.status === 'succeeded' ? 'active' : 'past-due'}`} style={{ marginLeft: '0.75rem' }}>
                    {payment.status}
                  </span>
                </div>
                <span className="payment-date">
                  {new Date(payment.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              No payment history available
            </p>
          )}
        </div>
      </div>

      {showRevokeModal && (
        <div className="modal-overlay" onClick={() => setShowRevokeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <style jsx>{`
              .modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
              }
              .modal {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 2rem;
                width: 100%;
                max-width: 450px;
              }
              .modal h2 {
                color: var(--danger);
                margin-bottom: 1rem;
              }
              .modal p {
                margin-bottom: 1.5rem;
                color: var(--text-secondary);
              }
              .btn-row {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
              }
            `}</style>
            <h2>⚠️ Revoke Access</h2>
            <p>
              This will immediately prevent {student.name} from accessing the course materials.
              Do you also want to cancel their Stripe subscription?
            </p>
            <div className="btn-row">
              <button
                className="btn btn-danger"
                onClick={() => handleRevokeAccess(true)}
                disabled={actionLoading}
                style={{ width: '100%' }}
              >
                Revoke Access & Cancel Stripe
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleRevokeAccess(false)}
                disabled={actionLoading}
                style={{ width: '100%' }}
              >
                Revoke Access Only
              </button>
              <button
                className="btn"
                onClick={() => setShowRevokeModal(false)}
                style={{ width: '100%', background: 'transparent' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
