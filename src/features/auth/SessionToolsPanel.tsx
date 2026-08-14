import type { FormEvent } from 'react'
import type { ResetPasswordFormState } from '../../types/app'
import { PanelHeading } from '../../components/ui/PanelHeading'

type Props = {
  resetForm: ResetPasswordFormState
  onResetFormChange: (field: keyof ResetPasswordFormState, value: string) => void
  onRefreshToken: () => void
  onLoadMe: () => void
  onLogout: () => void
  onResetPassword: (event: FormEvent<HTMLFormElement>) => void
}

export function SessionToolsPanel({
  resetForm,
  onResetFormChange,
  onRefreshToken,
  onLoadMe,
  onLogout,
  onResetPassword,
}: Props) {
  return (
    <section className="panel">
      <PanelHeading
        title="Session Tools"
        subtitle="Covers POST /refresh-token, GET /me, POST /logout, and POST /reset-password."
      />
      <div className="button-cluster">
        <button type="button" className="action-button" onClick={onRefreshToken}>
          Refresh Token
        </button>
        <button type="button" className="action-button" onClick={onLoadMe}>
          Load Me
        </button>
        <button type="button" className="action-button action-button-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>

      <form className="stacked-form compact-gap" onSubmit={onResetPassword}>
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
          Reset Password
        </button>
      </form>
    </section>
  )
}
