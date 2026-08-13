import type { FormEvent } from 'react'
import type { ResetPasswordFormState, SessionState } from '../../types/app'
import { SessionSnapshotPanel } from './SessionSnapshotPanel'
import { SessionToolsPanel } from './SessionToolsPanel'

type Props = {
  resetForm: ResetPasswordFormState
  session: SessionState
  onResetFormChange: (field: keyof ResetPasswordFormState, value: string) => void
  onRefreshToken: () => void
  onLoadMe: () => void
  onLogout: () => void
  onResetPassword: (event: FormEvent<HTMLFormElement>) => void
}

export function SessionPage(props: Props) {
  return (
    <main className="page-shell">
      <div className="view-grid">
        <SessionToolsPanel
          resetForm={props.resetForm}
          onResetFormChange={props.onResetFormChange}
          onRefreshToken={props.onRefreshToken}
          onLoadMe={props.onLoadMe}
          onLogout={props.onLogout}
          onResetPassword={props.onResetPassword}
        />
        <SessionSnapshotPanel session={props.session} />
      </div>
    </main>
  )
}
