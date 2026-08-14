import type { FormEvent } from 'react'
import type { SignInFormState } from '../../types/app'
import { PanelHeading } from '../../components/ui/PanelHeading'

type Props = {
  form: SignInFormState
  onChange: (field: keyof SignInFormState, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function SignInPanel({ form, onChange, onSubmit }: Props) {
  return (
    <section className="panel">
      <PanelHeading
        title="Sign In"
        subtitle="Calls POST /api/auth/sign-in and saves the returned JWT session locally."
      />
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
    </section>
  )
}
