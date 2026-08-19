import { useState, useEffect } from 'react';
import { Badge, ConfirmDialog, Table, type Column } from '../components/common';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { AddStockModal } from '../components/products/AddStockModal';
import { StockHistoryModal } from '../components/products/StockHistoryModal';
import { useModal } from '../hooks';
import { productsService } from '../api/services/productsService';
import { categoriesService } from '../api/services/categoriesService';
import type {
  Product,
  Category,
  CreateProductInput,
  UpdateProductInput,
  StockMovement,
} from '../types';
import { formatCurrency, formatDate } from '../utils';

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'low_stock' | 'discontinued'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const productFormModal = useModal<Product>();
  const addStockModal = useModal<Product>();
  const historyModal = useModal<Product>();
  const deactivateModal = useModal<Product>();

  const [selectedProductMovements, setSelectedProductMovements] = useState<StockMovement[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productsService.getProducts(selectedCategory, activeTab !== 'discontinued'),
        categoriesService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, activeTab]);

  const handleProductSubmit = async (data: CreateProductInput | UpdateProductInput) => {
    setIsLoading(true);
    try {
      if (productFormModal.data) {
        await productsService.updateProduct(productFormModal.data.id, data as UpdateProductInput, 'Admin');
      } else {
        await productsService.createProduct(data as CreateProductInput, 'Admin');
      }
      await loadData();
      productFormModal.close();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = async (quantityAdded: number, reason: string) => {
    if (!addStockModal.data) return;
    setIsLoading(true);
    try {
      await productsService.addStock(
        {
          productId: addStockModal.data.id,
          quantityAdded,
          reason,
        },
        'Ahmad (Admin)'
      );
      await loadData();
      addStockModal.close();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenHistory = async (product: Product) => {
    setIsLoading(true);
    try {
      const movements = await productsService.getStockHistory(product.id);
      setSelectedProductMovements(movements);
      historyModal.open(product);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateModal.data) return;
    const targetId = deactivateModal.data.id;
    setIsLoading(true);
    try {
      await productsService.deactivateProduct(targetId);
      setProducts((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, isActive: false } : p))
      );
      await loadData();
      deactivateModal.close();
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockCount = products.filter(
    (p) => p.isActive && p.quantity <= p.minStockLevel
  ).length;

  const totalActiveProducts = products.filter((p) => p.isActive).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

    let matchesTab = true;
    if (activeTab === 'low_stock') {
      matchesTab = p.isActive && p.quantity <= p.minStockLevel;
    } else if (activeTab === 'discontinued') {
      matchesTab = !p.isActive;
    } else {
      matchesTab = p.isActive;
    }

    return matchesSearch && matchesCategory && matchesTab;
  });

  const columns: Column<Product>[] = [
    {
      header: 'Product Name',
      cell: (p) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{p.name}</p>
          <p className="text-[10px] text-slate-400">{p.categoryName}</p>
        </div>
      ),
    },
    {
      header: 'Selling Unit',
      cell: (p) => (
        <Badge variant="info">
          {p.unit === 'package' ? 'Package (باكيج)' : 'Piece (حبة)'}
        </Badge>
      ),
    },
    {
      header: 'Selling Price',
      cell: (p) => <span className="font-bold text-emerald-600 text-xs">{formatCurrency(p.sellingPrice)}</span>,
    },
    {
      header: 'Stock Status',
      cell: (p) => {
        if (!p.isActive) {
          return <Badge variant="danger">Deactivated</Badge>;
        }
        if (p.quantity === 0) {
          return <Badge variant="danger">Out of Stock (0)</Badge>;
        }
        if (p.quantity <= p.minStockLevel) {
          return (
            <Badge variant="warning">
              Low Stock ({p.quantity} {p.unit})
            </Badge>
          );
        }
        return <Badge variant="success">In Stock ({p.quantity} {p.unit})</Badge>;
      },
    },
    {
      header: 'Last Modified',
      cell: (p) => <span className="text-xs text-slate-500">{formatDate(p.updatedAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (p) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => productFormModal.open(p)}
            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            Edit
          </button>

          <button
            onClick={() => addStockModal.open(p)}
            disabled={!p.isActive}
            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-40 cursor-pointer"
          >
            + Add Stock
          </button>

          <button
            onClick={() => handleOpenHistory(p)}
            className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer"
          >
            Audit
          </button>

          {p.isActive && (
            <button
              onClick={() => deactivateModal.open(p)}
              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Products Catalog & Stock Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage inventory with Piece/Package units, replenish stock, and monitor alerts.</p>
        </div>

        <button
          onClick={() => productFormModal.open()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
        >
          + Add New Product
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Active Products</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalActiveProducts}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Low Stock Warnings</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-black text-amber-600">{lowStockCount}</p>
            {lowStockCount > 0 && <Badge variant="warning">Needs Stock</Badge>}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Categories</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{categories.length}</p>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Active Products ({totalActiveProducts})
          </button>

          <button
            onClick={() => setActiveTab('low_stock')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'low_stock'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ⚠️ Low Stock Warnings ({lowStockCount})
          </button>

          <button
            onClick={() => setActiveTab('discontinued')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'discontinued'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Deactivated Products
          </button>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product by name..."
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 w-full sm:w-72"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 self-center font-medium">
            Showing {filteredProducts.length} items
          </span>
        </div>
      </div>

      {/* Products Table */}
      <Table
        columns={columns}
        data={filteredProducts}
        keyExtractor={(p) => p.id}
        emptyMessage="No products matching the selected criteria."
      />

      {/* Modals */}
      <ProductFormModal
        isOpen={productFormModal.isOpen}
        onClose={productFormModal.close}
        onSubmit={handleProductSubmit}
        product={productFormModal.data}
        categories={categories}
        isLoading={isLoading}
      />

      <AddStockModal
        isOpen={addStockModal.isOpen}
        onClose={addStockModal.close}
        onSubmit={handleAddStock}
        product={addStockModal.data}
        isLoading={isLoading}
      />

      <StockHistoryModal
        isOpen={historyModal.isOpen}
        onClose={historyModal.close}
        product={historyModal.data}
        movements={selectedProductMovements}
        isLoading={isLoading}
      />

      <ConfirmDialog
        isOpen={deactivateModal.isOpen}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate "${deactivateModal.data?.name}"?`}
        onConfirm={handleDeactivate}
        onCancel={deactivateModal.close}
        isLoading={isLoading}
      />
    </div>
  );
};
