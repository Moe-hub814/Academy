'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  // Skip auth check for login page
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false)
      return
    }

    // Check if admin is authenticated
    fetch('/api/auth/admin/check')
      .then(res => {
        if (!res.ok) {
          router.push('/admin/login')
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        router.push('/admin/login')
      })
  }, [pathname, router, isLoginPage])

  const handleLogout = async () => {
    await fetch('/api/auth/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (checking) {
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
    <div className="admin-layout">
      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 260px;
          background: var(--bg-card);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
        }
        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .logo {
          font-family: var(--font-mono);
          font-size: 1.25rem;
          font-weight: 600;
        }
        .logo-bracket {
          color: var(--accent-primary);
        }
        .admin-badge {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent-secondary);
          margin-top: 0.25rem;
        }
        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 150ms ease;
          font-size: 0.9rem;
        }
        .nav-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .nav-item.active {
          background: var(--accent-glow);
          color: var(--accent-primary);
          border-right: 2px solid var(--accent-primary);
        }
        .nav-icon {
          font-size: 1.1rem;
        }
        .sidebar-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
        }
        .logout-btn {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-family: var(--font-display);
          font-size: 0.875rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .logout-btn:hover {
          background: rgba(255, 77, 106, 0.1);
          border-color: var(--danger);
          color: var(--danger);
        }
        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 2rem;
        }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-bracket">[</span>
            Cybermoe_
            <span className="logo-bracket">]</span>
          </div>
          <div className="admin-badge">Admin Portal</div>
        </div>

        <nav className="sidebar-nav">
          <Link
            href="/admin"
            className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link
            href="/admin/students"
            className={`nav-item ${pathname?.startsWith('/admin/students') ? 'active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            Students
          </Link>
          <Link
            href="/"
            className="nav-item"
            target="_blank"
          >
            <span className="nav-icon">🌐</span>
            View Site
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
