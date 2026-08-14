import type { FormEvent } from 'react'
import { AuthShell } from '../../components/ui/AuthShell'
import type { SignInFormState } from '../../types/app'

type Props = {
  form: SignInFormState
  onChange: (field: keyof SignInFormState, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginPage({ form, onChange, onSubmit }: Props) {
  return (
    <AuthShell
      title="Sign in to continue"
      subtitle="Access reports, printing, and operational pages from a proper secured entry screen."
    >
      <div className="auth-card-copy">
        <h2>Login</h2>
        <p>Use your employee username and password.</p>
      </div>
      <form className="stacked-form" onSubmit={onSubmit}>
        <label>
          Username
          <input value={form.username} onChange={(event) => onChange('username', event.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => onChange('password', event.target.value)}
          />
        </label>
        <button type="submit" className="action-button">
          Sign In
        </button>
      </form>
      <div className="page-link-row">
        <span>Accounts are created by the system admin only.</span>
      </div>
    </AuthShell>
  )
}
