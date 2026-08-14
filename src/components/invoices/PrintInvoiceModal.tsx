import { useState } from 'react';
import { Printer, FileText, Receipt } from 'lucide-react';
import { Modal } from '../common';
import type { Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const PrintInvoiceModal = ({
  isOpen,
  onClose,
  invoice,
}: PrintInvoiceModalProps) => {
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice #${invoice.invoiceNumber}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Toggle Format Buttons */}
        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200 print:hidden">
          <div className="flex gap-2">
            <button
              onClick={() => setPrintFormat('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                printFormat === 'thermal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal Receipt (80mm)</span>
            </button>
            <button
              onClick={() => setPrintFormat('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                printFormat === 'a4'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Standard A4 Print</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* PRINT CONTENT AREA */}
        <div className="p-4 bg-slate-100 rounded-xl flex justify-center overflow-x-auto border border-slate-200">
          {printFormat === 'thermal' ? (
            /* THERMAL 80mm RECEIPT LAYOUT */
            <div id="thermal-receipt" className="w-[300px] bg-white p-4 font-mono text-xs text-slate-900 border border-slate-300 shadow-xs print:w-full print:p-0 print:border-none print:shadow-none">
              {/* Header */}
              <div className="text-center space-y-1 border-b border-dashed pb-3 mb-3 border-slate-400">
                <h2 className="text-base font-extrabold tracking-wide">SUPERMARKET POS</h2>
                <p className="text-[10px] text-slate-600">Main Store Branch</p>
                <p className="text-[10px] text-slate-600">Tel: +962 6 500 0000</p>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-1 border-b border-dashed pb-3 mb-3 text-[11px] border-slate-400">
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span className="font-bold">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{formatDate(invoice.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{invoice.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span>{invoice.customerName || 'Walk-in'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-b border-dashed pb-3 mb-3 border-slate-400">
                <div className="grid grid-cols-12 font-bold border-b border-slate-300 pb-1 mb-2 text-[10px]">
                  <span className="col-span-6">ITEM</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-4 text-right">TOTAL</span>
                </div>

                <div className="space-y-2">
                  {invoice.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px]">
                      <div className="col-span-6">
                        <p className="font-semibold truncate">{item.productNameSnapshot}</p>
                        <p className="text-[9px] text-slate-500">{formatCurrency(item.unitPriceSnapshot)} / {item.unit}</p>
                      </div>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals (Percentage Discount on Invoice Level, NO Tax) */}
              <div className="space-y-1 text-[11px] border-b border-dashed pb-3 mb-3 border-slate-400">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(invoice.totalBeforeDiscount)}</span>
                </div>
                {invoice.discountPercentage > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>DISCOUNT ({invoice.discountPercentage}%):</span>
                    <span>-{formatCurrency(invoice.totalBeforeDiscount * (invoice.discountPercentage / 100))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold border-t border-slate-400 pt-1 mt-1">
                  <span>TOTAL DUE (CASH):</span>
                  <span>{formatCurrency(invoice.totalAfterDiscount)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center space-y-1 text-[10px] text-slate-600 pt-1">
                <p className="font-semibold">PAYMENT: CASH ONLY</p>
                <p className="italic">Thank you for shopping with us!</p>
              </div>
            </div>
          ) : (
            /* STANDARD A4 PRINT LAYOUT */
            <div className="w-full bg-white p-6 rounded-xl text-sm text-slate-800 space-y-6 border border-slate-200">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-blue-900">SUPERMARKET POS SYSTEM</h2>
                  <p className="text-xs text-slate-500">Sales Invoice</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900">{invoice.invoiceNumber}</span>
                  <p className="text-xs text-slate-500">{formatDate(invoice.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg">
                <div>
                  <p className="font-bold text-slate-500">Customer:</p>
                  <p className="font-semibold text-slate-800">{invoice.customerName || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500">Issued By:</p>
                  <p className="font-semibold text-slate-800">Cashier: {invoice.employeeName}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-2 border-b">Product</th>
                    <th className="p-2 border-b">Unit</th>
                    <th className="p-2 border-b text-right">Price</th>
                    <th className="p-2 border-b text-center">Qty</th>
                    <th className="p-2 border-b text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{item.productNameSnapshot}</td>
                      <td className="p-2 text-slate-500 uppercase">{item.unit}</td>
                      <td className="p-2 text-right">{formatCurrency(item.unitPriceSnapshot)}</td>
                      <td className="p-2 text-center font-bold">{item.quantity}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Before Discount:</span>
                    <span className="font-semibold">{formatCurrency(invoice.totalBeforeDiscount)}</span>
                  </div>
                  {invoice.discountPercentage > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount ({invoice.discountPercentage}%):</span>
                      <span>-{formatCurrency(invoice.totalBeforeDiscount * (invoice.discountPercentage / 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2 text-slate-900">
                    <span>Total Paid (Cash):</span>
                    <span className="text-emerald-600">{formatCurrency(invoice.totalAfterDiscount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
