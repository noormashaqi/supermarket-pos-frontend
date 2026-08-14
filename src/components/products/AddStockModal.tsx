import { useState, type FormEvent } from 'react';
import { Modal } from '../common';
import type { Product } from '../../types';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantityAdded: number, reason: string) => void;
  product?: Product | null;
  isLoading?: boolean;
}

export const AddStockModal = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading = false,
}: AddStockModalProps) => {
  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState('Supplier Stock Arrival');

  if (!product) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum <= 0) return;
    onSubmit(qtyNum, reason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Stock: ${product.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current stock status */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex justify-between items-center">
          <span className="font-semibold">Current Stock Balance:</span>
          <span className="font-bold text-sm text-blue-700">{product.quantity} {product.unit}</span>
        </div>

        {/* Quantity to add */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Units to Add <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 50"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Source / Note
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Supplier Stock Arrival">Supplier Stock Arrival</option>
            <option value="Customer Return">Customer Return</option>
            <option value="Audit Inventory Adjustment">Audit Inventory Adjustment</option>
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4 border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
