import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import type { SessionState } from '../../types/app'

type Props = {
  session: SessionState
  onLogout: () => void
  children: ReactNode
}

export function MainLayout({ session, onLogout, children }: Props) {
  return (
    <div className="workspace-shell">
      <AppHeader session={session} onLogout={onLogout} />
      <section className="workspace-content">{children}</section>
    </div>
  )
}
