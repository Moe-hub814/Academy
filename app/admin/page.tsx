'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  pastDueStudents: number
  selfPacedCount: number
  mentorshipCount: number
  recentSignups: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="dashboard">
      <style jsx>{`
        .dashboard h1 {
          margin-bottom: 2rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.5rem;
        }
        .stat-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: 600;
          font-family: var(--font-mono);
        }
        .stat-value.primary { color: var(--accent-primary); }
        .stat-value.secondary { color: var(--accent-secondary); }
        .stat-value.tertiary { color: var(--accent-tertiary); }
        .stat-value.warning { color: var(--warning); }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
        }
        .view-all {
          font-size: 0.875rem;
          color: var(--accent-primary);
        }
        .recent-list {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }
        .recent-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }
        .recent-item:last-child {
          border-bottom: none;
        }
        .recent-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .recent-name {
          font-weight: 500;
        }
        .recent-email {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .recent-meta {
          text-align: right;
        }
        .recent-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>

      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value primary">{stats?.totalStudents || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Subscriptions</div>
          <div className="stat-value secondary">{stats?.activeStudents || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Past Due</div>
          <div className="stat-value warning">{stats?.pastDueStudents || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Self-Paced</div>
          <div className="stat-value">{stats?.selfPacedCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mentorship</div>
          <div className="stat-value tertiary">{stats?.mentorshipCount || 0}</div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Recent Signups</h2>
        <Link href="/admin/students" className="view-all">View All →</Link>
      </div>

      <div className="recent-list">
        {stats?.recentSignups && stats.recentSignups.length > 0 ? (
          stats.recentSignups.map((student) => (
            <Link
              href={`/admin/students/${student.id}`}
              key={student.id}
              className="recent-item"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="recent-info">
                <span className="recent-name">{student.name}</span>
                <span className="recent-email">{student.email}</span>
              </div>
              <div className="recent-meta">
                <span className={`badge badge-${student.tier}`}>
                  {student.tier}
                </span>
                <div className="recent-date">
                  {new Date(student.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-state">
            No students yet. They'll appear here when they sign up.
          </div>
        )}
      </div>
    </div>
  )
}
