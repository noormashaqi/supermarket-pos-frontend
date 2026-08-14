import { navigateTo } from '../../lib/routing'
import type { SessionState } from '../../types/app'

type Props = {
  session: SessionState
  onLogout: () => void
}

export function AppHeader({ session, onLogout }: Props) {
  const initials = session.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <header className="app-header">
      <div className="brand-block">
        <button type="button" className="brand-mark" onClick={() => navigateTo('dashboard')}>
          SM
        </button>
        <div>
          <p className="brand-title">Supermarket System</p>
          <span className="brand-subtitle">Operations workspace</span>
        </div>
      </div>

      <div className="header-actions">
        <button type="button" className="ghost-button" onClick={() => navigateTo('dashboard')}>
          Home
        </button>
        {session.role === 'Admin' ? (
          <button type="button" className="ghost-button" onClick={() => navigateTo('users')}>
            Users
          </button>
        ) : null}
        <button type="button" className="ghost-button" onClick={() => navigateTo('reports')}>
          Reports & Printing
        </button>
        <button type="button" className="profile-pill" onClick={() => navigateTo('profile')}>
          <span className="profile-avatar">{initials || 'U'}</span>
          <span className="profile-copy">
            <strong>{session.fullName || session.username}</strong>
            <small>{session.role}</small>
          </span>
        </button>
        <button type="button" className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
