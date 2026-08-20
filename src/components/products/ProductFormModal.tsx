import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '../common';
import type { Product, Category, CreateProductInput, UpdateProductInput, ProductUnit } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => void;
  product?: Product | null;
  categories: Category[];
  isLoading?: boolean;
}

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  isLoading = false,
}: ProductFormModalProps) => {
  const isEditing = Boolean(product);

  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('0');
  const [minStockLevel, setMinStockLevel] = useState('10');
  const [unit, setUnit] = useState<ProductUnit>('piece');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSellingPrice(String(product.sellingPrice || ''));
      setCostPrice(String(product.costPrice || ''));
      setInitialQuantity(String(product.quantity || '0'));
      setMinStockLevel(String(product.minStockLevel || '10'));
      setUnit(product.unit || 'piece');
      setCategoryId(product.categoryId ? String(product.categoryId) : '');
    } else {
      setName('');
      setSellingPrice('');
      setCostPrice('');
      setInitialQuantity('0');
      setMinStockLevel('10');
      setUnit('piece');
      setCategoryId(categories && categories.length > 0 ? String(categories[0].id) : '');
    }
  }, [product, categories, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !sellingPrice || !categoryId) {
      console.warn('Form validation blocked submit:', { name, sellingPrice, categoryId });
      return;
    }

    if (isEditing) {
      const updateData: UpdateProductInput = {
        name,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice) || 0,
        minStockLevel: Number(minStockLevel) || 0,
        unit,
        categoryId,
      };
      onSubmit(updateData);
    } else {
      const createData: CreateProductInput = {
        name,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice) || 0,
        initialQuantity: Number(initialQuantity) || 0,
        minStockLevel: Number(minStockLevel) || 0,
        unit,
        categoryId,
      };
      onSubmit(createData);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Product: ${product?.name}` : 'Add New Product'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Whole Milk 1L"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.code})
                </option>
              ))}
            </select>
          </div>

          {/* Selling Unit (Piece / Package) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Selling Unit (وحدة البيع) <span className="text-rose-500">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="piece">Piece (حبة)</option>
              <option value="package">Package (باكيج)</option>
            </select>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Selling Price ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cost Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Initial Stock Quantity (Creating only) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Low Stock Warning Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Low Stock Alert Threshold
            </label>
            <input
              type="number"
              min="0"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
              placeholder="10"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
