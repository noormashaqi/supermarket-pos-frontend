import { KeyValueGrid } from '../../components/ui/KeyValueGrid'
import { PanelHeading } from '../../components/ui/PanelHeading'
import { TokenList } from '../../components/ui/TokenList'
import type { SessionState } from '../../types/app'

export function SessionSnapshotPanel({ session }: { session: SessionState }) {
  return (
    <section className="panel">
      <PanelHeading
        title="Session Snapshot"
        subtitle="Live local session state returned from the backend."
      />
      <KeyValueGrid
        pairs={[
          ['Employee ID', session.employeeId ? String(session.employeeId) : ''],
          ['Full Name', session.fullName],
          ['Username', session.username],
          ['Role', session.role],
          ['Expires At', session.expiresAt],
          ['Refresh Token', session.refreshToken ? `${session.refreshToken.slice(0, 18)}...` : ''],
        ]}
      />
      <TokenList title="Permissions" values={session.permissions} />
    </section>
  )
}
