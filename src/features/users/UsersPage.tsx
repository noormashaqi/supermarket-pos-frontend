import type { FormEvent } from 'react'
import type { CreateUserFormState, EmployeeOption } from '../../types/app'

type Props = {
  form: CreateUserFormState
  searchTerm: string
  employees: EmployeeOption[]
  onFormChange: (field: keyof CreateUserFormState, value: string) => void
  onSearchChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onToggleStatus: (employee: EmployeeOption) => void
  onRefresh: () => void
}

export function UsersPage(props: Props) {
  return (
    <main className="users-page">
      <section className="welcome-panel">
        <div>
          <span className="eyebrow">Admin Only</span>
          <h2>User Management</h2>
          <p>Create users, search the full employee list, and activate or deactivate accounts.</p>
        </div>
        <div className="welcome-actions">
          <button type="button" className="action-button-secondary" onClick={props.onRefresh}>
            Refresh List
          </button>
        </div>
      </section>

      <section className="users-grid">
        <article className="panel">
          <div className="auth-card-copy">
            <h2>Add User</h2>
            <p>Only admins can create accounts from this screen.</p>
          </div>
          <form className="stacked-form" onSubmit={props.onSubmit}>
            <label>
              Full Name
              <input
                value={props.form.fullName}
                onChange={(event) => props.onFormChange('fullName', event.target.value)}
              />
            </label>
            <label>
              Username
              <input
                value={props.form.username}
                onChange={(event) => props.onFormChange('username', event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={props.form.password}
                onChange={(event) => props.onFormChange('password', event.target.value)}
              />
            </label>
            <label>
              Role
              <select
                value={props.form.role}
                onChange={(event) => props.onFormChange('role', event.target.value)}
              >
                <option value="Cashier">Cashier</option>
                <option value="InventoryEmployee">Inventory Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <button type="submit" className="action-button">
              Create User
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="reports-hero">
            <div>
              <span className="eyebrow">Employees</span>
              <h2>All Users</h2>
            </div>
            <label className="compact-field">
              Search
              <input
                placeholder="Search by name, username, or role"
                value={props.searchTerm}
                onChange={(event) => props.onSearchChange(event.target.value)}
              />
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {props.employees.length ? (
                  props.employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.fullName}</td>
                      <td>{employee.username}</td>
                      <td>{employee.role}</td>
                      <td>
                        <span className={employee.isActive ? 'user-status active' : 'user-status inactive'}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={employee.isActive ? 'action-button status-button danger' : 'action-button status-button'}
                          onClick={() => props.onToggleStatus(employee)}
                        >
                          {employee.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">No users matched your search.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  )
}
