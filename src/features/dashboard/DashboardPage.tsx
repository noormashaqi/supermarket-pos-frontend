import { navigateTo } from '../../lib/routing'
import type { SessionState } from '../../types/app'

export function DashboardPage({ session }: { session: SessionState }) {
  return (
    <main className="dashboard-page">
      <section className="welcome-panel">
        <div>
          <span className="eyebrow">Main Page</span>
          <h2>Welcome back, {session.fullName || session.username}</h2>
          <p>
            Use the navigation to move between reports, invoice printing, and your profile
            settings.
          </p>
        </div>
        <div className="welcome-actions">
          {session.role === 'Admin' ? (
            <button type="button" className="action-button-secondary" onClick={() => navigateTo('users')}>
              Manage Users
            </button>
          ) : null}
          <button type="button" className="action-button" onClick={() => navigateTo('reports')}>
            Open Reports & Printing
          </button>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <span className="mini-label">User Access</span>
          <h3>Admin can create accounts and control who is active in the system.</h3>
          <p>Search employees, activate them again, or stop access instantly from one place.</p>
        </article>
        <article className="feature-card">
          <span className="mini-label">Reports Center</span>
          <h3>Choose a report from one dropdown and print it professionally.</h3>
          <p>Sales, inventory, attendance, employees, employee detail, and product detail.</p>
        </article>
        <article className="feature-card">
          <span className="mini-label">Invoice Printing</span>
          <h3>Load invoices, preview the receipt, then print or save as PDF.</h3>
          <p>The page is focused on invoice operations without mixing it into reports.</p>
        </article>
        <article className="feature-card">
          <span className="mini-label">Profile</span>
          <h3>Manage your current session and reset your password from the profile page.</h3>
          <p>Profile information and session tools now live under one dedicated area.</p>
        </article>
      </section>
    </main>
  )
}
