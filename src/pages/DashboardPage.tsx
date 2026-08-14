import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  PackageX, 
  Plus, 
  ShoppingCart, 
  Package, 
  Users, 
  RefreshCw
} from 'lucide-react';
import { Badge, Table, type Column } from '../components/common';
import { dashboardService, type DashboardSummary } from '../api/services/dashboardService';
import { productsService } from '../api/services/productsService';
import { formatCurrency, getSession } from '../utils';
import { AddStockModal } from '../components/products/AddStockModal';
import { useModal } from '../hooks';
import type { Product } from '../types';

export const DashboardPage = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    todaySales: 0,
    invoiceCount: 0,
    lowStockProductCount: 0,
    outOfStockProductCount: 0,
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const addStockModal = useModal<Product>();
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, prods] = await Promise.all([
        dashboardService.getSummary(),
        productsService.getProducts(),
      ]);
      setSummary(sum);
      setProducts(prods);
    } catch (err) {
      console.error('Error loading dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStockSubmit = async (quantityAdded: number, reason: string) => {
    if (!addStockModal.data) return;
    setIsLoading(true);
    const session = getSession();
    const currentEmployeeName = session ? (session.fullName || session.username) : 'Admin';
    
    try {
      await productsService.addStock(
        {
          productId: addStockModal.data.id,
          quantityAdded,
          reason,
        },
        currentEmployeeName
      );
      await loadData();
      addStockModal.close();
    } catch (err) {
      console.error('Stock replenish failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockProducts = products.filter(
    (p) => p.isActive && p.quantity <= p.minStockLevel && p.quantity > 0
  );

  const outOfStockProducts = products.filter(
    (p) => p.isActive && p.quantity === 0
  );

  const columns: Column<Product>[] = [
    {
      header: 'Product Name',
      cell: (p) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{p.name}</p>
          <p className="text-[10px] text-slate-400 font-medium">{p.categoryName}</p>
        </div>
      ),
    },
    {
      header: 'Unit Type',
      cell: (p) => (
        <Badge variant="info">
          {p.unit === 'package' ? 'Package (باكيج)' : 'Piece (حبة)'}
        </Badge>
      ),
    },
    {
      header: 'Available Stock',
      cell: (p) => (
        <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-0.5">
          {p.quantity} {p.unit}s
        </span>
      ),
    },
    {
      header: 'Min Threshold',
      cell: (p) => <span className="text-xs text-slate-500 font-semibold">{p.minStockLevel} {p.unit}s</span>,
    },
    {
      header: 'Actions',
      cell: (p) => (
        <button
          onClick={() => addStockModal.open(p)}
          className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Replenish</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Admin Control Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time shop status overview. Monitor gross revenue, stock shortage alerts, and quick actions.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Sales</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(summary.todaySales)}</p>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Invoices</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{summary.invoiceCount} sales</p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Low Stock items</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{summary.lowStockProductCount} alerts</p>
          </div>
        </div>

        {/* Out of stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <PackageX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Out of Stock</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{summary.outOfStockProductCount} items</p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Shortcuts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/pos')}
            className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left hover:bg-blue-100/50 cursor-pointer transition-colors"
          >
            <ShoppingCart className="w-4 h-4 text-blue-600 mb-1.5" />
            <p className="text-xs font-bold text-blue-900">POS Checkout</p>
            <p className="text-[9px] text-blue-600 mt-0.5">Register a customer sale</p>
          </button>
          
          <button
            onClick={() => navigate('/invoices')}
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left hover:bg-emerald-100/50 cursor-pointer transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-600 mb-1.5" />
            <p className="text-xs font-bold text-emerald-900">Invoices & Returns</p>
            <p className="text-[9px] text-emerald-600 mt-0.5">Manage receipts and returns</p>
          </button>

          <button
            onClick={() => navigate('/products')}
            className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-left hover:bg-purple-100/50 cursor-pointer transition-colors"
          >
            <Package className="w-4 h-4 text-purple-600 mb-1.5" />
            <p className="text-xs font-bold text-purple-900">Add New Product</p>
            <p className="text-[9px] text-purple-600 mt-0.5">Define new inventory SKU</p>
          </button>

          <button
            onClick={() => navigate('/employees')}
            className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100/50 cursor-pointer transition-colors"
          >
            <Users className="w-4 h-4 text-amber-600 mb-1.5" />
            <p className="text-xs font-bold text-amber-900">Manage Employees</p>
            <p className="text-[9px] text-amber-600 mt-0.5">Staff shifts & permissions</p>
          </button>
        </div>
      </div>

      {/* Main Stock shortage alert grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock warnings table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Low Stock Alerts (منتجات قاربت على الانتهاء)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">Stock level has fallen below defined min-stock threshold.</p>
            
            <Table
              columns={columns}
              data={lowStockProducts}
              keyExtractor={(p) => p.id}
              emptyMessage="All active products are currently well-stocked."
            />
          </div>
        </div>

        {/* Out of Stock alerts list */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs h-full flex flex-col">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <PackageX className="w-4 h-4 text-rose-600" />
              <span>Out of Stock (منتجات نفدت بالكامل)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">SKUs with zero stock units remaining.</p>
            
            <div className="flex-1 overflow-y-auto space-y-2 max-h-96 pr-1">
              {outOfStockProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 text-center">
                  <Package className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No Out of Stock items</p>
                  <p className="text-[10px] text-slate-400">All products have 1 or more available units.</p>
                </div>
              ) : (
                outOfStockProducts.map((p) => (
                  <div key={p.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex justify-between items-center hover:bg-rose-50 transition-colors">
                    <div className="min-w-0 mr-2">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.categoryName}</p>
                    </div>
                    <button
                      onClick={() => addStockModal.open(p)}
                      className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 rounded-lg hover:bg-rose-200 shrink-0 cursor-pointer"
                    >
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Stock Dialog */}
      <AddStockModal
        isOpen={addStockModal.isOpen}
        onClose={addStockModal.close}
        onSubmit={handleAddStockSubmit}
        product={addStockModal.data}
        isLoading={isLoading}
      />
    </div>
  );
};
