import { useState, type FormEvent } from 'react';
import { Modal } from '../common';
import type { Invoice, Product, ReturnType } from '../../types';
import { returnsService } from '../../api/services/returnsService';

interface ReturnExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  products: Product[];
  onSuccess: () => void;
}

export const ReturnExchangeModal = ({
  isOpen,
  onClose,
  invoice,
  products,
  onSuccess,
}: ReturnExchangeModalProps) => {
  const [returnType, setReturnType] = useState<ReturnType>('PureReturn');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityReturned, setQuantityReturned] = useState('1');
  const [replacementProductId, setReplacementProductId] = useState('');
  const [replacementQuantity, setReplacementQuantity] = useState('1');
  const [reason, setReason] = useState('Defective item / Customer preference');
  const [isLoading, setIsLoading] = useState(false);

  if (!invoice) return null;

  const handleAction = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const returnQtyNum = Number(quantityReturned);
    if (!returnQtyNum || returnQtyNum <= 0) return;

    // Check Max return quantity limit
    const originalItem = invoice.items.find((i) => i.productId === selectedProductId);
    if (originalItem && returnQtyNum > originalItem.quantity) {
      alert(`Cannot return more than original purchased quantity (${originalItem.quantity} ${originalItem.unit})!`);
      return;
    }

    setIsLoading(true);
    try {
      if (returnType === 'PureReturn') {
        await returnsService.executePureReturn({
          originalInvoiceId: invoice.id,
          productId: selectedProductId,
          quantityReturned: returnQtyNum,
          reason,
        });
      } else {
        if (!replacementProductId) {
          alert('Please select a replacement product for exchange.');
          setIsLoading(false);
          return;
        }
        await returnsService.executeExchange({
          originalInvoiceId: invoice.id,
          productId: selectedProductId,
          quantityReturned: returnQtyNum,
          newItems: [{ productId: replacementProductId, quantity: Number(replacementQuantity) || 1 }],
          reason,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Failed: ${err.message || 'Transaction failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Return / Exchange for Invoice #${invoice.invoiceNumber}`}
      maxWidth="lg"
    >
      <form onSubmit={handleAction} className="space-y-4">
        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setReturnType('PureReturn')}
            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              returnType === 'PureReturn'
                ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ↩️ Pure Return (إرجاع فقط)
            <p className="text-[10px] text-slate-500 font-normal mt-0.5">
              Restores item to stock. No new invoice issued.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setReturnType('Exchange')}
            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              returnType === 'Exchange'
                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            🔄 Item Exchange (تبديل بصنف آخر)
            <p className="text-[10px] text-slate-500 font-normal mt-0.5">
              Restores old item & issues a new separate invoice for replacement.
            </p>
          </button>
        </div>

        {/* Product To Return */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Select Item to Return <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>-- Select Purchased Item --</option>
            {invoice.items.map((item) => (
              <option key={item.productId} value={item.productId}>
                {item.productNameSnapshot} (Purchased Qty: {item.quantity} {item.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Returned */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Quantity Returned <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            required
            value={quantityReturned}
            onChange={(e) => setQuantityReturned(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Exchange Replacement Selection */}
        {returnType === 'Exchange' && (
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase">Replacement Item Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Replacement Product
                </label>
                <select
                  required
                  value={replacementProductId}
                  onChange={(e) => setReplacementProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>-- Select Replacement Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.sellingPrice} / {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Replacement Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={replacementQuantity}
                  onChange={(e) => setReplacementQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Reason / Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Reason for Return / Exchange
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Expired, damaged, or customer request"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            {isLoading ? 'Processing...' : returnType === 'PureReturn' ? 'Confirm Pure Return' : 'Confirm Exchange'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
