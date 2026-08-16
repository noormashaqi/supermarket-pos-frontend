import { useState, useEffect } from 'react';
import { Printer, FileText, Receipt, Loader2 } from 'lucide-react';
import { Modal } from '../common';
import type { Invoice } from '../../types';
import type { PrintableInvoice } from '../../types/app';
import { invoicesService } from '../../api/services/invoicesService';
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
  const [printableData, setPrintableData] = useState<PrintableInvoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && invoice?.id) {
      setIsLoading(true);
      invoicesService
        .getPrintableInvoice(invoice.id)
        .then((data) => {
          if (data) {
            setPrintableData(data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setPrintableData(null);
    }
  }, [isOpen, invoice?.id]);

  if (!invoice) return null;

  const displayCashier = printableData?.employeeName || invoice.employeeName || 'Staff';
  const displayDate = printableData?.date ? formatDate(printableData.date) : formatDate(invoice.createdAt);
  const displayItems = printableData?.items && printableData.items.length > 0
    ? printableData.items.map((i) => ({
        name: i.productName,
        price: i.unitPrice,
        qty: i.quantity,
        total: i.lineTotal,
        unit: 'piece',
      }))
    : invoice.items.map((i) => ({
        name: i.productNameSnapshot,
        price: i.unitPriceSnapshot,
        qty: i.quantity,
        total: i.lineTotal,
        unit: i.unit || 'piece',
      }));

  const subtotal = printableData?.totalBeforeDiscount ?? invoice.totalBeforeDiscount;
  const discountPct = printableData?.discountPercentage ?? invoice.discountPercentage;
  const discountAmt = printableData?.discountAmount ?? (subtotal * (discountPct / 100));
  const totalPayable = printableData?.totalAfterDiscount ?? invoice.totalAfterDiscount;

  const handlePrint = () => {
    let contentHtml = '';
    if (printFormat === 'thermal' && printableData?.htmlReceipt) {
      contentHtml = printableData.htmlReceipt;
    } else {
      const el = document.getElementById(printFormat === 'thermal' ? 'thermal-receipt' : 'a4-receipt');
      if (!el) return;

      contentHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Invoice #${invoice.invoiceNumber}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace, sans-serif; margin: 0; padding: 15px; color: #000; background: #fff; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { padding: 4px 2px; border-bottom: 1px dotted #ccc; text-align: left; font-size: 11px; }
              th { border-bottom: 1px solid #000; border-top: 1px solid #000; font-weight: bold; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .border-dashed { border-style: dashed; }
              @media print {
                @page { size: ${printFormat === 'thermal' ? '80mm auto' : 'A4'}; margin: ${printFormat === 'thermal' ? '0' : '15mm'}; }
                body { width: 100%; margin: 0; padding: 5px; }
              }
            </style>
          </head>
          <body>
            ${el.innerHTML}
          </body>
        </html>
      `;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(contentHtml);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 300);
    }
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
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            <span>Print Receipt</span>
          </button>
        </div>

        {/* PRINT CONTENT AREA */}
        <div className="p-4 bg-slate-100 rounded-xl flex justify-center overflow-x-auto border border-slate-200">
          {printFormat === 'thermal' ? (
            /* THERMAL 80mm RECEIPT LAYOUT */
            <div id="thermal-receipt" className="w-[300px] bg-white p-4 font-mono text-xs text-slate-900 border border-slate-300 shadow-xs">
              {/* Header */}
              <div className="text-center space-y-1 border-b border-dashed pb-3 mb-3 border-slate-400">
                <h2 className="text-base font-extrabold tracking-wide">SUPERMARKET POS</h2>
                <p className="text-[10px] text-slate-600">Sales Receipt</p>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-1 border-b border-dashed pb-3 mb-3 text-[11px] border-slate-400">
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span className="font-bold">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{displayDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{displayCashier}</span>
                </div>
                {invoice.customerName && (
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span>{invoice.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border-b border-dashed pb-3 mb-3 border-slate-400">
                <div className="grid grid-cols-12 font-bold border-b border-slate-300 pb-1 mb-2 text-[10px]">
                  <span className="col-span-6">ITEM</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-4 text-right">TOTAL</span>
                </div>

                <div className="space-y-2">
                  {displayItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px]">
                      <div className="col-span-6">
                        <p className="font-semibold truncate">{item.name}</p>
                        <p className="text-[9px] text-slate-500">{formatCurrency(item.price)}</p>
                      </div>
                      <span className="col-span-2 text-center">{item.qty}</span>
                      <span className="col-span-4 text-right font-bold">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed pb-3 mb-3 border-slate-400">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountPct > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>DISCOUNT ({discountPct}%):</span>
                    <span>-{formatCurrency(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold border-t border-slate-400 pt-1 mt-1">
                  <span>TOTAL DUE (CASH):</span>
                  <span>{formatCurrency(totalPayable)}</span>
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
            <div id="a4-receipt" className="w-full bg-white p-6 rounded-xl text-sm text-slate-800 space-y-6 border border-slate-200">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-blue-900">SUPERMARKET POS SYSTEM</h2>
                  <p className="text-xs text-slate-500">Sales Invoice</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900">{invoice.invoiceNumber}</span>
                  <p className="text-xs text-slate-500">{displayDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg">
                <div>
                  <p className="font-bold text-slate-500">Customer:</p>
                  <p className="font-semibold text-slate-800">{invoice.customerName || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500">Issued By:</p>
                  <p className="font-semibold text-slate-800">Cashier: {displayCashier}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-2 border-b">Product</th>
                    <th className="p-2 border-b text-right">Price</th>
                    <th className="p-2 border-b text-center">Qty</th>
                    <th className="p-2 border-b text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="p-2 text-center font-bold">{item.qty}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Before Discount:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount ({discountPct}%):</span>
                      <span>-{formatCurrency(discountAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2 text-slate-900">
                    <span>Total Paid (Cash):</span>
                    <span className="text-emerald-600">{formatCurrency(totalPayable)}</span>
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
