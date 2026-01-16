'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Progress {
  modules: Array<{
    module_number: number
    completed: boolean
    completed_at: string | null
    time_spent_minutes: number
  }>
  completed: number
  total: number
  percent: number
}

interface Student {
  id: string
  name: string
  email: string
  tier: string
}

const moduleData = [
  {
    number: 0,
    title: 'Introduction',
    description: 'Welcome to CyberMoe Academy and course overview'
  },
  {
    number: 1,
    title: 'Federal Cybersecurity Fundamentals',
    description: 'FISMA, NIST frameworks, and the federal cybersecurity landscape'
  },
  {
    number: 2,
    title: 'RMF Mastery',
    description: 'Complete RMF lifecycle from categorization to authorization'
  },
  {
    number: 3,
    title: 'Vulnerability Management & ACAS',
    description: 'ACAS, Tenable Security Center, and vulnerability remediation'
  },
  {
    number: 4,
    title: 'eMASS and GRC Tools',
    description: 'Hands-on with eMASS and governance, risk, compliance tools'
  },
  {
    number: 5,
    title: 'Security Control Assessment',
    description: 'Assessing controls, gathering evidence, and documenting findings'
  },
  {
    number: 6,
    title: 'POA&M Management',
    description: 'POA&M creation, tracking, and lifecycle management'
  },
  {
    number: 7,
    title: 'AI Security',
    description: 'AI threats, NIST AI RMF, and securing AI systems'
  },
  {
    number: 8,
    title: 'Incident Response',
    description: 'Incident handling, classification, and federal reporting'
  },
  {
    number: 9,
    title: 'FedRAMP & Cloud Security',
    description: 'FedRAMP authorization process and cloud security controls'
  },
  {
    number: 10,
    title: 'Career Development',
    description: 'Resume building, interviews, and landing your ISSO role'
  }
]

export default function StudentDashboard() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const authRes = await fetch('/api/auth/student/check')
      if (!authRes.ok) {
        router.push('/login')
        return
      }
      const studentData = await authRes.json()
      setStudent(studentData.student)

      const progressRes = await fetch('/api/progress')
      if (progressRes.ok) {
        const progressData = await progressRes.json()
        setProgress(progressData)
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/student/logout', { method: 'POST' })
    router.push('/login')
  }

  const getNextModule = () => {
    // For now, return module 0 as starting point
    // Can be enhanced to track actual progress
    return 0
  }

  const calculateProgress = () => {
    // Placeholder - will be enhanced with actual progress tracking
    return { completed: 0, total: 11, percent: 0 }
  }

  const progressStats = calculateProgress()

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="dashboard">
      <style jsx>{`
        .dashboard {
          min-height: 100vh;
        }
        .header {
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          font-family: var(--font-mono);
          font-size: 1.25rem;
          font-weight: 600;
        }
        .logo-bracket {
          color: var(--accent-primary);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .user-info {
          text-align: right;
        }
        .user-name {
          font-weight: 500;
        }
        .user-tier {
          font-size: 0.75rem;
          color: var(--accent-secondary);
          text-transform: uppercase;
        }
        .logout-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-family: var(--font-display);
          transition: all 150ms ease;
        }
        .logout-btn:hover {
          border-color: var(--danger);
          color: var(--danger);
        }
        .main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        .welcome {
          margin-bottom: 2rem;
        }
        .welcome h1 {
          margin-bottom: 0.5rem;
        }
        .welcome p {
          color: var(--text-muted);
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .progress-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .progress-ring {
          width: 80px;
          height: 80px;
          position: relative;
          flex-shrink: 0;
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
          font-size: 1.25rem;
          font-weight: 600;
        }
        .progress-info h3 {
          margin-bottom: 0.25rem;
        }
        .progress-info p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .continue-card {
          border-color: var(--accent-primary);
          background: linear-gradient(135deg, var(--bg-card), var(--accent-glow));
        }
        .continue-card h3 {
          margin-bottom: 0.5rem;
        }
        .continue-card p {
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        .modules-section {
          margin-top: 2rem;
        }
        .modules-section h2 {
          margin-bottom: 1.5rem;
        }
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }
        .module-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: all 150ms ease;
          text-decoration: none;
          color: inherit;
        }
        .module-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
        }
        .module-card.completed {
          border-color: var(--success);
          opacity: 0.8;
        }
        .module-number {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .module-card.completed .module-number {
          background: var(--success);
          color: var(--bg-primary);
        }
        .module-content {
          flex: 1;
        }
        .module-content h4 {
          margin-bottom: 0.25rem;
          font-size: 1rem;
        }
        .module-content p {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .module-status {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .module-status.completed {
          color: var(--success);
        }
        .module-status.in-progress {
          color: var(--accent-secondary);
        }
        .tier-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--accent-glow);
          color: var(--accent-primary);
          border-radius: 100px;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-left: 0.5rem;
        }
      `}</style>

      <header className="header">
        <div className="logo">
          <span className="logo-bracket">[</span>
          Cybermoe_
          <span className="logo-bracket">]</span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-name">
              {student?.name}
              <span className="tier-badge">{student?.tier}</span>
            </div>
            <div className="user-tier">{student?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="main">
        <div className="welcome">
          <h1>Welcome back, {student?.name?.split(' ')[0]}!</h1>
          <p>Continue your journey to becoming a federal cybersecurity professional.</p>
        </div>

        <div className="stats-row">
          <div className="stat-card progress-card">
            <div className="progress-ring">
              <svg viewBox="0 0 100 100">
                <circle className="progress-ring-bg" cx="50" cy="50" r="42" />
                <circle
                  className="progress-ring-fill"
                  cx="50"
                  cy="50"
                  r="42"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressStats.percent / 100)}`}
                />
              </svg>
              <div className="progress-ring-text">{progressStats.percent}%</div>
            </div>
            <div className="progress-info">
              <h3>{progressStats.completed} of {progressStats.total} Modules</h3>
              <p>Keep up the great work!</p>
            </div>
          </div>

          <div className="stat-card continue-card">
            <h3>Start Learning</h3>
            <p>Module {getNextModule()}: {moduleData[getNextModule()]?.title}</p>
            <Link href={`/course/module-${getNextModule()}`} className="btn btn-primary">
              Begin Course →
            </Link>
          </div>
        </div>

        <section className="modules-section">
          <h2>Course Modules</h2>
          <div className="modules-grid">
            {moduleData.map((module) => {
              const isCompleted = false // Will be enhanced with actual progress

              return (
                <Link
                  key={module.number}
                  href={`/course/module-${module.number}`}
                  className={`module-card ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="module-number">
                    {isCompleted ? '✓' : module.number}
                  </div>
                  <div className="module-content">
                    <h4>{module.title}</h4>
                    <p>{module.description}</p>
                    <div className={`module-status ${isCompleted ? 'completed' : 'in-progress'}`}>
                      {isCompleted ? '✓ Completed' : 'Start Module →'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
