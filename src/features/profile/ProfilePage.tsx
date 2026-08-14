import type { FormEvent } from 'react'
import type { ResetPasswordFormState, SessionState } from '../../types/app'

type Props = {
  session: SessionState
  resetForm: ResetPasswordFormState
  onResetFormChange: (field: keyof ResetPasswordFormState, value: string) => void
  onResetPassword: (event: FormEvent<HTMLFormElement>) => void
}

export function ProfilePage({
  session,
  resetForm,
  onResetFormChange,
  onResetPassword,
}: Props) {
  return (
    <main className="profile-page">
      <section className="panel profile-summary">
        <span className="eyebrow">Profile</span>
        <h2>{session.fullName || session.username}</h2>
        <div className="profile-grid">
          <div>
            <span className="mini-label">Username</span>
            <strong>{session.username}</strong>
          </div>
          <div>
            <span className="mini-label">Role</span>
            <strong>{session.role}</strong>
          </div>
          <div>
            <span className="mini-label">Employee ID</span>
            <strong>{session.employeeId ?? '-'}</strong>
          </div>
          <div>
            <span className="mini-label">Permissions</span>
            <strong>{session.permissions.length}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Reset password</h3>
        <p className="panel-description">Update the current account password from this page.</p>
        <form className="stacked-form" onSubmit={onResetPassword}>
          <label>
            Current Password
            <input
              type="password"
              value={resetForm.currentPassword}
              onChange={(event) => onResetFormChange('currentPassword', event.target.value)}
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={resetForm.newPassword}
              onChange={(event) => onResetFormChange('newPassword', event.target.value)}
            />
          </label>
          <button type="submit" className="action-button action-button-dark">
            Save New Password
          </button>
        </form>
      </section>
    </main>
  )
}
