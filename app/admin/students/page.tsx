'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  email: string
  tier: 'self-paced' | 'mentorship'
  subscription_status: 'active' | 'past_due' | 'canceled' | 'pending'
  created_at: string
  progress_percent: number
  modules_completed: number
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [page, tierFilter, statusFilter])

  const fetchStudents = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      ...(search && { search }),
      ...(tierFilter !== 'all' && { tier: tierFilter }),
      ...(statusFilter !== 'all' && { status: statusFilter })
    })

    try {
      const res = await fetch(`/api/students?${params}`)
      const data = await res.json()
      setStudents(data.students || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchStudents()
  }

  return (
    <div className="students-page">
      <style jsx>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .search-form {
          display: flex;
          gap: 0.5rem;
          flex: 1;
          min-width: 200px;
        }
        .search-input {
          flex: 1;
          padding: 0.625rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-primary);
          font-family: var(--font-display);
        }
        .filter-select {
          padding: 0.625rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-primary);
          font-family: var(--font-display);
          cursor: pointer;
        }
        .table-container {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }
        .student-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 120px;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          text-decoration: none;
          color: inherit;
          transition: background 150ms ease;
        }
        .student-row:hover {
          background: var(--bg-elevated);
        }
        .student-row.header {
          background: var(--bg-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
        }
        .student-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .student-name {
          font-weight: 500;
        }
        .student-email {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .progress-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .progress-mini {
          width: 60px;
          height: 4px;
          background: var(--bg-secondary);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-mini-fill {
          height: 100%;
          background: var(--accent-primary);
        }
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .page-btn {
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>

      <div className="page-header">
        <h1>Students</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Student
        </button>
      </div>

      <div className="filters">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        <select
          className="filter-select"
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Tiers</option>
          <option value="self-paced">Self-Paced</option>
          <option value="mentorship">Mentorship</option>
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      <div className="table-container">
        <div className="student-row header">
          <span>Student</span>
          <span>Tier</span>
          <span>Status</span>
          <span>Progress</span>
          <span>Joined</span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : students.length > 0 ? (
          students.map((student) => (
            <Link
              href={`/admin/students/${student.id}`}
              key={student.id}
              className="student-row"
            >
              <div className="student-info">
                <span className="student-name">{student.name}</span>
                <span className="student-email">{student.email}</span>
              </div>
              <span className={`badge badge-${student.tier}`}>
                {student.tier}
              </span>
              <span className={`badge badge-${student.subscription_status.replace('_', '-')}`}>
                {student.subscription_status.replace('_', ' ')}
              </span>
              <div className="progress-cell">
                <div className="progress-mini">
                  <div
                    className="progress-mini-fill"
                    style={{ width: `${student.progress_percent}%` }}
                  />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {student.modules_completed}/8
                </span>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {new Date(student.created_at).toLocaleDateString()}
              </span>
            </Link>
          ))
        ) : (
          <div className="empty-state">
            No students found matching your criteria.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            ← Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            className="page-btn"
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchStudents(); }}
        />
      )}
    </div>
  )
}

function AddStudentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<'self-paced' | 'mentorship'>('self-paced')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, tier })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create student')
        return
      }

      if (data.temporaryPassword) {
        setTempPassword(data.temporaryPassword)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (tempPassword) {
    return (
      <div className="modal-overlay" onClick={onClose}>
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
              margin-bottom: 1rem;
              color: var(--success);
            }
            .password-box {
              background: var(--bg-secondary);
              border: 1px solid var(--border-color);
              border-radius: 4px;
              padding: 1rem;
              font-family: var(--font-mono);
              font-size: 1.25rem;
              text-align: center;
              margin: 1.5rem 0;
              user-select: all;
            }
            .warning {
              font-size: 0.875rem;
              color: var(--warning);
              margin-bottom: 1.5rem;
            }
          `}</style>
          <h2>✓ Student Created</h2>
          <p>Send this temporary password to the student:</p>
          <div className="password-box">{tempPassword}</div>
          <p className="warning">⚠️ This password will not be shown again. Make sure to copy it now.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onSuccess}>
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
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
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
          }
          .close-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 1.5rem;
            cursor: pointer;
          }
          .error {
            background: rgba(255, 77, 106, 0.1);
            border: 1px solid var(--danger);
            color: var(--danger);
            padding: 0.75rem;
            border-radius: 4px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }
          .tier-selector {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .tier-option {
            padding: 1rem;
            background: var(--bg-secondary);
            border: 2px solid var(--border-color);
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
          }
          .tier-option.selected {
            border-color: var(--accent-primary);
            background: var(--accent-glow);
          }
          .tier-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
          }
          .tier-price {
            font-size: 0.875rem;
            color: var(--text-muted);
          }
          .btn-row {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
          }
        `}</style>

        <div className="modal-header">
          <h2>Add Student</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student's full name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tier</label>
            <div className="tier-selector">
              <div
                className={`tier-option ${tier === 'self-paced' ? 'selected' : ''}`}
                onClick={() => setTier('self-paced')}
              >
                <div className="tier-name">Self-Paced</div>
                <div className="tier-price">$1,497</div>
              </div>
              <div
                className={`tier-option ${tier === 'mentorship' ? 'selected' : ''}`}
                onClick={() => setTier('mentorship')}
              >
                <div className="tier-name">Mentorship</div>
                <div className="tier-price">$3,997</div>
              </div>
            </div>
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
