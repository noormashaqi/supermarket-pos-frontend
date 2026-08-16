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
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Check per-action screen permissions instead of hardcoded roles
  const canPOS = hasPermission(PermissionKeys.SalesCreate);
  const canInvoices = hasPermission(PermissionKeys.InvoicesView);
  const canProducts = hasPermission(PermissionKeys.ProductsView) || hasPermission(PermissionKeys.ProductsManage);
  const canCategories = hasPermission(PermissionKeys.CategoriesView) || hasPermission(PermissionKeys.CategoriesManage);
  const canStockHistory = hasPermission(PermissionKeys.StockAdd);
  const canEmployees = hasPermission(PermissionKeys.EmployeesView) || hasPermission(PermissionKeys.EmployeesManage);
  const canReports = hasPermission(PermissionKeys.ReportsView);
  const canDashboard = hasPermission(PermissionKeys.DashboardView);

  // Default redirect path after login
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* STREAMLINED HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
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

            {/* Navigation Links - Per-Action Permission Checked */}
            <nav className="flex space-x-1 overflow-x-auto bg-slate-100 p-1 rounded-xl scrollbar-none items-center">
              {session && canPOS && (
                <NavLink
                  to="/pos"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>POS Checkout</span>
                </NavLink>
              )}

              {session && canInvoices && (
                <NavLink
                  to="/invoices"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer ml-2 border border-transparent hover:border-rose-100 transition-all whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout (@{session.username})</span>
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
          
          <Route path="*" element={<Navigate to="/" replace />} />
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