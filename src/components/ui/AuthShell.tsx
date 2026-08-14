import type { ReactNode } from 'react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <span className="eyebrow">Supermarket System</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>
      <section className="auth-card">{children}</section>
    </main>
  )
}
