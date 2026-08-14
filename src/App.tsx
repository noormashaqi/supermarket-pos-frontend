import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  ShoppingCart,
  Printer,
  KeyRound,
  Package,
  Tags,
  History,
  Users,
} from 'lucide-react';
import { PosTerminal } from './components/pos/PosTerminal';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { StockHistoryPage } from './pages/StockHistoryPage';
import { PrintingPage } from './pages/PrintingPage';
import { AuthPage } from './pages/AuthPage';
import { UsersPageWrapper } from './pages/UsersPageWrapper';

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

              {/* Navigation Links */}
              <nav className="flex space-x-1 overflow-x-auto bg-slate-100 p-1 rounded-xl scrollbar-none">
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

                <NavLink
                  to="/printing"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Invoice Printing</span>
                </NavLink>

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
                  <span>Products & Stock</span>
                </NavLink>

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
              </nav>
            </div>
          </div>
        </header>

        {/* MAIN ROUTE CONTENT */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route path="/pos" element={<PosTerminal />} />
            <Route path="/printing" element={<PrintingPage />} />
            <Route path="/employees" element={<UsersPageWrapper />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/stock-history" element={<StockHistoryPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}