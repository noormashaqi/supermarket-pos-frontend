import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  PackageX, 
  Plus, 
  ShoppingCart, 
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
        productsService.getProducts(undefined, true),
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

  // Compute live low stock and out of stock counts from product list
  const lowStockProducts = products.filter(
    (p) => p.isActive && p.quantity <= p.minStockLevel
  );

  const outOfStockProducts = products.filter(
    (p) => p.isActive && p.quantity === 0
  );

  const lowStockCount = lowStockProducts.length > 0 ? lowStockProducts.length : summary.lowStockProductCount;
  const outOfStockCount = outOfStockProducts.length > 0 ? outOfStockProducts.length : summary.outOfStockProductCount;

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
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
            p.quantity === 0
              ? 'text-rose-600 bg-rose-50 border-rose-200'
              : 'text-amber-600 bg-amber-50 border-amber-200'
          }`}
        >
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
            <span>Admin Control Dashboard (لوحة التحكم)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time shop status overview. Monitor gross revenue, stock shortage alerts, and quick actions.
          </p>
        </div>
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
            <p className="text-2xl font-black text-amber-600 mt-0.5">{lowStockCount} alerts</p>
          </div>
        </div>

        {/* Out of stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <PackageX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Out of Stock</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{outOfStockCount} items</p>
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
            className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100/50 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-600 mb-1.5" />
            <p className="text-xs font-bold text-amber-900">Products & Inventory</p>
            <p className="text-[9px] text-amber-600 mt-0.5">Manage catalog and stock</p>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-left hover:bg-purple-100/50 cursor-pointer transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-purple-600 mb-1.5" />
            <p className="text-xs font-bold text-purple-900">Sales Reports</p>
            <p className="text-[9px] text-purple-600 mt-0.5">View performance analytics</p>
          </button>
        </div>
      </div>

      {/* Low Stock Items Attention Required */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock Items Needing Restock ({lowStockProducts.length})</span>
          </h2>
          <button
            onClick={() => navigate('/products')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            View All Products →
          </button>
        </div>

        <Table
          columns={columns}
          data={lowStockProducts}
          keyExtractor={(p) => String(p.id)}
          emptyMessage="All products have sufficient stock levels!"
        />
      </div>

      {/* Add Stock Modal */}
      {addStockModal.data && (
        <AddStockModal
          isOpen={addStockModal.isOpen}
          onClose={addStockModal.close}
          product={addStockModal.data}
          onSubmit={handleAddStockSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
