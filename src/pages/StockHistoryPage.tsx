import { useState, useEffect } from 'react';
import { Badge, Table, type Column } from '../components/common';
import { AddStockModal } from '../components/products/AddStockModal';
import { useModal } from '../hooks';
import { productsService } from '../api/services/productsService';
import type { Product, StockMovement } from '../types';
import { formatDate } from '../utils';

export const StockHistoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const addStockModal = useModal<Product>();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, moves] = await Promise.all([
        productsService.getProducts(),
        productsService.getStockHistory(),
      ]);
      setProducts(prods);
      setMovements(moves);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStock = async (quantityAdded: number, reason: string) => {
    if (!addStockModal.data) return;
    setIsLoading(true);

    try {
      await productsService.addStock({
        productId: addStockModal.data.id,
        quantityAdded,
        reason,
      });
      await loadData();
      addStockModal.close();
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMovements = movements.filter(
    (m) => selectedProductId === 'all' || m.productId === selectedProductId
  );

  const columns: Column<StockMovement>[] = [
    {
      header: 'Date & Time',
      cell: (m) => <span className="text-xs text-slate-500">{formatDate(m.createdAt)}</span>,
    },
    {
      header: 'Product Name',
      cell: (m) => <span className="font-bold text-slate-800 text-xs">{m.productName}</span>,
    },
    {
      header: 'Quantity Added',
      cell: (m) => <span className="font-bold text-emerald-600 text-xs">+{m.quantityAdded}</span>,
    },
    {
      header: 'Reason / Source',
      cell: (m) => <span className="text-xs text-slate-600">{m.reason}</span>,
    },
    {
      header: 'Added By (Employee)',
      cell: (m) => <Badge variant="info">{m.employeeName}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Stock History & Addition</h1>
          <p className="text-xs text-slate-500 mt-0.5">Add stock quantity (Stock In) and track historical addition logs with employee timestamps.</p>
        </div>
      </div>

      {/* Quick Add Stock Card Selection */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase">Quick Add Stock to Product (إضافة كمية للمخزون)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {products.filter((p) => p.isActive).map((p) => (
            <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-500">Current: {p.quantity} {p.unit}</p>
              </div>
              <button
                onClick={() => addStockModal.open(p)}
                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg cursor-pointer shadow-sm"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600">Filter by Product:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Products History</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 self-center font-medium">
          Showing {filteredMovements.length} Stock Addition Records
        </span>
      </div>

      {/* Audit Logs Table */}
      <Table
        columns={columns}
        data={filteredMovements}
        keyExtractor={(m) => m.id}
        emptyMessage="No stock addition logs recorded yet."
      />

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={addStockModal.isOpen}
        onClose={addStockModal.close}
        onSubmit={handleAddStock}
        product={addStockModal.data}
        isLoading={isLoading}
      />
    </div>
  );
};
