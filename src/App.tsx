import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Tags,
  History,
} from 'lucide-react';
import { PosTerminal } from './components/pos/PosTerminal';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { StockHistoryPage } from './pages/StockHistoryPage';
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { MainLayout } from './components/ui/MainLayout'
import { getErrorMessage } from './lib/formatters'
import { getRouteFromHash, navigateTo } from './lib/routing'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ReportsView } from './features/reports/ReportsView'
import { UsersPage } from './features/users/UsersPage'
import type {
  CategoryOption,
  CreateUserFormState,
  EmployeeOption,
  ProductOption,
  ReportFiltersState,
  ReportKind,
  ReportState,
  ResetPasswordFormState,
  SessionState,
  SignInFormState,
} from './types/app'
import type { RouteKey } from './types/routing'

const sessionStorageKey = 'supermarket-pos-session'

const emptySession: SessionState = {
  accessToken: '',
  refreshToken: '',
  employeeId: null,
  fullName: '',
  username: '',
  role: '',
  expiresAt: '',
  permissions: [],
}

const reportDefaults: ReportState = {
  sales: null,
  inventory: null,
  attendance: null,
  employees: null,
  employeeDetail: null,
  productDetail: null,
}

const defaultSignInForm: SignInFormState = {
  username: '',
  password: '',
}

const defaultCreateUserForm: CreateUserFormState = {
  fullName: '',
  username: '',
  password: '',
  role: 'Cashier',
}

const defaultResetForm: ResetPasswordFormState = {
  currentPassword: '',
  newPassword: '',
}

const defaultReportFilters: ReportFiltersState = {
  salesFromDate: '',
  salesToDate: '',
  salesEmployeeId: '',
  inventoryCategoryId: '',
  inventoryActiveOnly: 'true',
  attendanceFromDate: '',
  attendanceToDate: '',
  attendanceEmployeeId: '',
  employeesActiveOnly: '',
  employeesRole: '',
  employeeDetailId: '',
  employeeDetailFromDate: '',
  employeeDetailToDate: '',
  productDetailId: '',
  productDetailFromDate: '',
  productDetailToDate: '',
}

function App() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>(() =>
    typeof window === 'undefined' ? 'login' : getRouteFromHash(),
  )
  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem(sessionStorageKey)
    return saved ? (JSON.parse(saved) as SessionState) : emptySession
  })
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const [signInForm, setSignInForm] = useState<SignInFormState>(defaultSignInForm)
  const [createUserForm, setCreateUserForm] = useState<CreateUserFormState>(defaultCreateUserForm)
  const [resetForm, setResetForm] = useState<ResetPasswordFormState>(defaultResetForm)
  const [reportFilters, setReportFilters] = useState<ReportFiltersState>(defaultReportFilters)
  const [selectedReport, setSelectedReport] = useState<ReportKind>('sales')
  const [selectedReportRowIndex, setSelectedReportRowIndex] = useState<number | null>(null)
  const [userSearchTerm, setUserSearchTerm] = useState('')

  const [reports, setReports] = useState<ReportState>(reportDefaults)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [managedEmployees, setManagedEmployees] = useState<EmployeeOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const isAuthenticated = Boolean(session.accessToken)
  const isAdmin = session.role === 'Admin'

  useEffect(() => {
    const syncRouteFromHash = () => {
      const route = getRouteFromHash()
      setActiveRoute(route)
    }

    if (!window.location.hash) {
      navigateTo(isAuthenticated ? 'dashboard' : 'login')
    } else {
      syncRouteFromHash()
    }

    window.addEventListener('hashchange', syncRouteFromHash)
    return () => window.removeEventListener('hashchange', syncRouteFromHash)
  }, [isAuthenticated])

  useEffect(() => {
    localStorage.setItem(sessionStorageKey, JSON.stringify(session))
  }, [session])

  useEffect(() => {
    if (!isAuthenticated && activeRoute !== 'login') {
      navigateTo('login')
    }

    if (isAuthenticated && activeRoute === 'login') {
      navigateTo('dashboard')
    }

    if (isAuthenticated && activeRoute === 'users' && !isAdmin) {
      navigateTo('dashboard')
    }
  }, [activeRoute, isAdmin, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    void loadLookups()
    if (isAdmin) {
      void loadManagedEmployees()
    } else {
      setManagedEmployees([])
    }
  }, [isAdmin, isAuthenticated])

  async function requestJson<T>(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers)
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (session.accessToken) {
      headers.set('Authorization', `Bearer ${session.accessToken}`)
    }

    const response = await fetch(path, { ...options, headers })
    const contentType = response.headers.get('content-type') ?? ''
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    if (!response.ok) {
      if (response.status === 401 && session.accessToken) {
        clearSession('Your session expired or your account was deactivated.')
      }

      const message =
        typeof body === 'string'
          ? body
          : body?.message || `${response.status} ${response.statusText}`
      throw new Error(message)
    }

    return body as T
  }

  function beginAction() {
    setError('')
    setFeedback('')
  }

  function finishAction(message: string) {
    setFeedback(message)
  }

  function failAction(message: string) {
    setError(message)
    setFeedback('')
  }

  function clearSession(message?: string) {
    setSession(emptySession)
    setEmployees([])
    setManagedEmployees([])
    setProducts([])
    setCategories([])
    if (message) {
      setError(message)
      setFeedback('')
    }
    navigateTo('login')
  }

  function updateSignInForm(field: keyof SignInFormState, value: string) {
    setSignInForm((current) => ({ ...current, [field]: value }))
  }

  function updateCreateUserForm(field: keyof CreateUserFormState, value: string) {
    setCreateUserForm((current) => ({ ...current, [field]: value }))
  }

  function updateResetForm(field: keyof ResetPasswordFormState, value: string) {
    setResetForm((current) => ({ ...current, [field]: value }))
  }

  function updateReportFilter(field: keyof ReportFiltersState, value: string) {
    setReportFilters((current) => ({ ...current, [field]: value }))
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    beginAction()

    try {
      const result = await requestJson<SessionState>('/api/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(signInForm),
      })
      setSession(result)
      finishAction(`Welcome, ${result.fullName}.`)
      navigateTo('dashboard')
    } catch (requestError) {
      failAction(getErrorMessage(requestError))
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    beginAction()

    try {
      await requestJson<EmployeeOption>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(createUserForm),
      })
      setCreateUserForm(defaultCreateUserForm)
      await Promise.all([loadManagedEmployees(), loadLookups()])
      finishAction('User created successfully.')
    } catch (requestError) {
      failAction(getErrorMessage(requestError))
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    beginAction()

    try {
      await requestJson('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(resetForm),
      })
      setResetForm(defaultResetForm)
      finishAction('Password changed successfully.')
    } catch (requestError) {
      failAction(getErrorMessage(requestError))
    }
  }

  async function handleLogout() {
    beginAction()

    try {
      if (session.refreshToken) {
        await requestJson('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        })
      }
    } catch (requestError) {
      failAction(getErrorMessage(requestError))
    } finally {
      clearSession()
    }
  }

  async function runReport(key: keyof ReportState, path: string, label: string) {
    beginAction()

    try {
      const result = await requestJson(path)
      setReports((current) => ({ ...current, [key]: result }))
      setSelectedReportRowIndex(null)
      finishAction(`${label} loaded successfully.`)
    } catch (requestError) {
      failAction(getErrorMessage(requestError))
    }
  }

  function handlePrintReport(title: string, data: unknown) {
    if (!data || typeof data !== 'object') {
      failAction('Load a report before printing it.')
      return
    }

    const html = buildPrintableReportHtml(title, data as Record<string, unknown>)
    printHtmlDocument(html)
    finishAction('Report print preview opened. You can print it or save it as PDF.')
  }

  async function loadLookups() {
    try {
      const [employeeData, productData, categoryData] = await Promise.all([
        requestJson<EmployeeOption[]>('/api/employees'),
        requestJson<ProductOption[]>('/api/products?activeOnly=false'),
        requestJson<CategoryOption[]>('/api/categories'),
      ])

      setEmployees(employeeData.filter((employee) => employee.isActive))
      setProducts(productData.filter((product) => product.isActive))
      setCategories(categoryData)
    } catch {
      // Keep the app usable even if one lookup fails.
    }
  }

  async function loadManagedEmployees() {
    if (!isAdmin) {
      setManagedEmployees([])
      return
    }

    try {
      const employeeData = await requestJson<EmployeeOption[]>('/api/employees')
      setManagedEmployees(employeeData)
    } catch {
      // Ignore background refresh failures here.
    }
  }

  async function handleToggleUserStatus(employee: EmployeeOption) {
    beginAction()

    try {
      await requestJson(`/api/employees/${employee.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !employee.isActive }),
      })
      await Promise.all([loadManagedEmployees(), loadLookups()])
      finishAction(
        employee.isActive
          ? `${employee.fullName} was deactivated successfully.`
          : `${employee.fullName} was activated successfully.`,
      )
    } catch (requestError) {
      failAction(getErrorMessage(requestError))
    }
  }

  const filteredManagedEmployees = managedEmployees.filter((employee) => {
    const query = userSearchTerm.trim().toLowerCase()
    if (!query) return true

    return [employee.fullName, employee.username, employee.role].some((value) =>
      value.toLowerCase().includes(query),
    )
  })

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        {error ? <section className="error-strip">{error}</section> : null}
        {feedback ? <section className="feedback-strip">{feedback}</section> : null}
        <LoginPage form={signInForm} onChange={updateSignInForm} onSubmit={handleSignIn} />
      </div>
    )
  }

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
        {/* STREAMLINED HEADER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-none">
                    SUPERMARKET POS
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Inventory & POS Register</p>
                </div>
              </div>

              {/* Exact Requested Navigation Links Only */}
              <nav className="flex space-x-1 overflow-x-auto bg-slate-100 p-1 rounded-xl scrollbar-none">
                <NavLink
                  to="/pos"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>POS & Printable Thermal Receipt</span>
                </NavLink>

                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products & Stock Views</span>
                </NavLink>

                <NavLink
                  to="/categories"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  <Tags className="w-3.5 h-3.5" />
                  <span>Categories</span>
                </NavLink>

                <NavLink
                  to="/stock-history"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Stock History (+ Add & View Audit)</span>
                </NavLink>
              </nav>
            </div>
          </div>
        </header>

        {/* MAIN ROUTE CONTENT */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route path="/pos" element={<PosTerminal />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/stock-history" element={<StockHistoryPage />} />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
    <div className="app-shell workspace-mode">
      {error ? <section className="error-strip">{error}</section> : null}
      {feedback ? <section className="feedback-strip">{feedback}</section> : null}

      <MainLayout session={session} onLogout={handleLogout}>
        {activeRoute === 'dashboard' ? <DashboardPage session={session} /> : null}
        {activeRoute === 'users' && isAdmin ? (
          <UsersPage
            form={createUserForm}
            searchTerm={userSearchTerm}
            employees={filteredManagedEmployees}
            onFormChange={updateCreateUserForm}
            onSearchChange={setUserSearchTerm}
            onSubmit={handleCreateUser}
            onToggleStatus={handleToggleUserStatus}
            onRefresh={() => {
              void loadManagedEmployees()
            }}
          />
        ) : null}
        {activeRoute === 'reports' ? (
          <ReportsView
            selectedReport={selectedReport}
            selectedReportRowIndex={selectedReportRowIndex}
            filters={reportFilters}
            reports={reports}
            employees={employees}
            products={products}
            categories={categories}
            onSelectedReportChange={(value) => {
              setSelectedReport(value)
              setSelectedReportRowIndex(null)
            }}
            onSelectedReportRowChange={setSelectedReportRowIndex}
            onFilterChange={updateReportFilter}
            onRunReport={runReport}
            onPrintReport={handlePrintReport}
          />
        ) : null}
        {activeRoute === 'profile' ? (
          <ProfilePage
            session={session}
            resetForm={resetForm}
            onResetFormChange={updateResetForm}
            onResetPassword={handleResetPassword}
          />
        ) : null}
      </MainLayout>
    </div>
  )
}

function buildPrintableReportHtml(title: string, data: Record<string, unknown>) {
  const rows = extractPrintableRows(data)
  const summary = extractPrintableSummary(data)

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #17231d; }
          h1 { margin-bottom: 8px; }
          .meta { color: #4a6357; margin-bottom: 24px; }
          .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #d5ddd7; border-radius: 12px; padding: 12px 14px; }
          .card span { display: block; font-size: 12px; text-transform: uppercase; color: #587265; }
          .card strong { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d5ddd7; padding: 10px; text-align: left; }
          th { background: #eff5f1; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">Generated on ${new Date().toLocaleString()}</div>
        <section class="summary">
          ${summary
            .map(
              (item) => `
                <div class="card">
                  <span>${escapeHtml(item.label)}</span>
                  <strong>${escapeHtml(item.value)}</strong>
                </div>`,
            )
            .join('')}
        </section>
        ${
          rows.length
            ? `<table>
                <thead>
                  <tr>${Object.keys(rows[0]).map((key) => `<th>${escapeHtml(key)}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${rows
                    .map(
                      (row) =>
                        `<tr>${Object.values(row)
                          .map((value) => `<td>${escapeHtml(String(value ?? '-'))}</td>`)
                          .join('')}</tr>`,
                    )
                    .join('')}
                </tbody>
              </table>`
            : '<p>No detail rows available for this report.</p>'
        }
        <script>window.onload = function () { window.print(); };</script>
      </body>
    </html>
  `
}

function printHtmlDocument(html: string) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const frameDocument = iframe.contentWindow?.document
  if (!frameDocument || !iframe.contentWindow) {
    document.body.removeChild(iframe)
    throw new Error('Unable to open the print preview.')
  }

  frameDocument.open()
  frameDocument.write(html)
  frameDocument.close()

  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    window.setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }
}

function extractPrintableSummary(data: Record<string, unknown>) {
  return Object.entries(data)
    .filter(([, value]) => !Array.isArray(value) && typeof value !== 'object')
    .slice(0, 6)
    .map(([key, value]) => ({
      label: key,
      value: String(value ?? '-'),
    }))
}

function extractPrintableRows(data: Record<string, unknown>) {
  const arrayValue = Object.values(data).find((value) => Array.isArray(value))
  if (!Array.isArray(arrayValue)) return []

  return arrayValue.map((item) => {
    const row = item as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, normalizePrintValue(value)]),
    )
  })
}

function normalizePrintValue(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default App
