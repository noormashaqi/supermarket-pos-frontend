import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  KeyRound,
  Package,
  Tags,
  History,
  Users,
  LayoutDashboard,
  BarChart3,
  FileText,
  LogOut,
  BookOpen,
} from 'lucide-react';
import { PosTerminal } from './components/pos/PosTerminal';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { StockHistoryPage } from './pages/StockHistoryPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthPage } from './pages/AuthPage';
import { UsersPageWrapper } from './pages/UsersPageWrapper';
import { DebtsPage } from './pages/DebtsPage';
import type { SessionState } from './types/app';
import { hasPermission } from './utils';
import { PermissionKeys } from './types/employees';

function AppContent() {
  const location = useLocation();
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    const rawSession = localStorage.getItem('supermarket-pos-session');
    if (rawSession) {
      try {
        setSession(JSON.parse(rawSession));
      } catch {
        setSession(null);
      }
    } else {
      setSession(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('supermarket-pos-session');
    localStorage.removeItem('pos_session');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Check per-action screen permissions
  const canPOS = hasPermission(PermissionKeys.SalesCreate) || hasPermission('sales.create');
  const canDebts = hasPermission('debt.manage') || session?.role === 'Admin' || session?.role === 'admin';
  const canInvoices = hasPermission(PermissionKeys.InvoicesView) || hasPermission('invoices.view');
  const canProducts = hasPermission(PermissionKeys.ProductsView) || hasPermission(PermissionKeys.ProductsManage);
  const canCategories = hasPermission(PermissionKeys.CategoriesView) || hasPermission(PermissionKeys.CategoriesManage);
  const canStockHistory = hasPermission(PermissionKeys.StockAdd) || hasPermission('products.stock_add');
  const canEmployees = hasPermission(PermissionKeys.EmployeesView) || hasPermission(PermissionKeys.EmployeesManage);
  const canReports = hasPermission(PermissionKeys.ReportsView) || hasPermission('reports.view');
  const canDashboard = hasPermission(PermissionKeys.DashboardView) || hasPermission('dashboard.view');

  const getDefaultRoute = () => {
    if (canDashboard) return '/dashboard';
    if (canPOS) return '/pos';
    if (canInvoices) return '/invoices';
    if (canProducts) return '/products';
    if (canCategories) return '/categories';
    if (canStockHistory) return '/stock-history';
    if (canEmployees) return '/employees';
    if (canReports) return '/reports';
    return '/login';
  };

  return (
    <div className="min-h-screen font-sans antialiased text-slate-800 bg-slate-50/60">
      {/* Top Rainbow Accent Line */}
      <div className="h-1 rainbow-bar sticky top-0 z-50"></div>

      {/* STREAMLINED HEADER */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/70 sticky top-1 z-40 shadow-lg shadow-indigo-500/5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Active Status Pill */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-100">
                  <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h1 className="font-black text-slate-900 text-base tracking-tight leading-none flex items-center gap-1.5">
                  <span>SUPERMARKET</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">POS</span>
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Smart Register</p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ONLINE
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex space-x-1 overflow-x-auto bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 scrollbar-none items-center shadow-inner">
              {session && canPOS && (
                <NavLink
                  to="/pos"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>POS Register</span>
                </NavLink>
              )}

              {session && canDebts && (
                <NavLink
                  to="/debts"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Debt Notebook</span>
                </NavLink>
              )}

              {session && canInvoices && (
                <NavLink
                  to="/invoices"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoices & Returns</span>
                </NavLink>
              )}

              {session && canProducts && (
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products</span>
                </NavLink>
              )}

              {session && canCategories && (
                <NavLink
                  to="/categories"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <Tags className="w-3.5 h-3.5" />
                  <span>Categories</span>
                </NavLink>
              )}

              {session && canStockHistory && (
                <NavLink
                  to="/stock-history"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Stock History</span>
                </NavLink>
              )}

              {session && canEmployees && (
                <NavLink
                  to="/employees"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Employees</span>
                </NavLink>
              )}

              {session && canReports && (
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Reports</span>
                </NavLink>
              )}

              {session && canDashboard && (
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </NavLink>
              )}

              {session ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 cursor-pointer ml-2 transition-all whitespace-nowrap shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout (@{session.username})</span>
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`
                  }
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Auth Login</span>
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN ROUTE CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Navigate to={session ? getDefaultRoute() : "/login"} replace />} />
          <Route
            path="/pos"
            element={session && canPOS ? <PosTerminal /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/debts"
            element={session && canDebts ? <DebtsPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/invoices"
            element={session && canInvoices ? <InvoicesPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/products"
            element={session && canProducts ? <ProductsPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/categories"
            element={session && canCategories ? <CategoriesPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/stock-history"
            element={session && canStockHistory ? <StockHistoryPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/employees"
            element={session && canEmployees ? <UsersPageWrapper /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/reports"
            element={session && canReports ? <ReportsPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/dashboard"
            element={session && canDashboard ? <DashboardPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={!session ? <AuthPage /> : <Navigate to={getDefaultRoute()} replace />}
          />
          <Route path="*" element={<Navigate to={session ? getDefaultRoute() : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}