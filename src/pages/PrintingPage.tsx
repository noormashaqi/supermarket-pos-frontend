import { useState, useEffect } from 'react';
import { Printer, Search, FileText } from 'lucide-react';
import { Badge, Table, Modal, type Column } from '../components/common';
import { invoicesService } from '../api/services/invoicesService';
import type { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils';

export const PrintingPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const loadInvoices = async () => {
    try {
      const data = await invoicesService.getInvoices();
      setInvoices(data);
      if (data.length > 0 && !selectedInvoice) {
        setSelectedInvoice(data[0]);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice Number',
      cell: (inv) => (
        <span
          onClick={() => setSelectedInvoice(inv)}
          className="font-mono text-xs font-bold text-blue-600 hover:underline cursor-pointer"
        >
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      cell: (inv) => <span className="font-bold text-slate-800 text-xs">{inv.customerName || 'Walk-in'}</span>,
    },
    {
      header: 'Date & Time',
      cell: (inv) => <span className="text-xs text-slate-500">{formatDate(inv.createdAt)}</span>,
    },
    {
      header: 'Issued By',
      cell: (inv) => <Badge variant="info">{inv.employeeName}</Badge>,
    },
    {
      header: 'Total Amount',
      cell: (inv) => <span className="font-bold text-emerald-600 text-xs">{formatCurrency(inv.totalAfterDiscount)}</span>,
    },
    {
      header: 'Actions',
      cell: (inv) => (
        <button
          onClick={() => {
            setSelectedInvoice(inv);
            setIsPrintModalOpen(true);
          }}
          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Receipt</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <span>Invoice Search & Thermal Receipt Printing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search invoices, preview details, and generate printable 80mm thermal receipts or standard A4 copies.
          </p>
        </div>

        {selectedInvoice && (
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Selected #{selectedInvoice.invoiceNumber}</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice number or customer..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 font-medium"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredInvoices.length} Invoices
        </span>
      </div>

      {/* Grid: Invoice List & Preview Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Invoices Table */}
        <div className="lg:col-span-7 space-y-4">
          <Table
            columns={columns}
            data={filteredInvoices}
            keyExtractor={(inv) => inv.id}
            emptyMessage="No invoices found."
          />
        </div>

        {/* Right: Selected Invoice Details & Receipt Preview Card */}
        <div className="lg:col-span-5">
          {selectedInvoice ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Selected Invoice</span>
                  <h3 className="text-base font-extrabold text-blue-600">{selectedInvoice.invoiceNumber}</h3>
                </div>
                <Badge variant="success">Saved</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Customer</p>
                  <p className="font-bold text-slate-800">{selectedInvoice.customerName || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Cashier</p>
                  <p className="font-bold text-slate-800">{selectedInvoice.employeeName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Date & Time</p>
                  <p className="text-slate-600">{formatDate(selectedInvoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Payment</p>
                  <p className="font-bold text-emerald-600">Cash Only</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800 uppercase">Itemized Breakdown</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{item.productNameSnapshot}</p>
                        <p className="text-[10px] text-slate-500">
                          {formatCurrency(item.unitPriceSnapshot)} / {item.unit} x {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600 self-center">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoice.totalBeforeDiscount)}</span>
                </div>
                {selectedInvoice.discountPercentage > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount ({selectedInvoice.discountPercentage}%):</span>
                    <span>-{formatCurrency(selectedInvoice.totalBeforeDiscount * (selectedInvoice.discountPercentage / 100))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2 mt-1">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600 text-base">{formatCurrency(selectedInvoice.totalAfterDiscount)}</span>
                </div>
              </div>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>OPEN PRINT PREVIEW / 80mm THERMAL RECEIPT</span>
              </button>
            </div>
          ) : (
            <div className="h-full bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 text-center">
              <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No Invoice Selected</p>
              <p className="text-[10px] text-slate-400">Click any invoice row to view receipt details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Thermal Receipt Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={`Print Receipt: #${selectedInvoice.invoiceNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 rounded-xl flex justify-center border border-slate-200">
              <div id="thermal-receipt" className="w-[300px] bg-white p-4 font-mono text-xs text-slate-900 border border-slate-300 shadow-xs">
                <div className="text-center space-y-1 border-b border-dashed pb-3 mb-3 border-slate-400">
                  <h2 className="text-base font-extrabold">SUPERMARKET POS</h2>
                  <p className="text-[10px] text-slate-600">Main Store Branch</p>
                </div>
                <div className="space-y-1 border-b border-dashed pb-3 mb-3 text-[11px] border-slate-400">
                  <div className="flex justify-between">
                    <span>RECEIPT NO:</span>
                    <span className="font-bold">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{formatDate(selectedInvoice.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CASHIER:</span>
                    <span>{selectedInvoice.employeeName}</span>
                  </div>
                </div>
                <div className="border-b border-dashed pb-3 mb-3 border-slate-400">
                  <div className="grid grid-cols-12 font-bold border-b border-slate-300 pb-1 mb-2 text-[10px]">
                    <span className="col-span-6">ITEM</span>
                    <span className="col-span-2 text-center">QTY</span>
                    <span className="col-span-4 text-right">TOTAL</span>
                  </div>
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px] mb-1">
                      <span className="col-span-6 truncate">{item.productNameSnapshot}</span>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold">{formatCurrency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-[11px] border-b border-dashed pb-3 mb-3 border-slate-400">
                  <div className="flex justify-between text-sm font-extrabold border-t border-slate-400 pt-1">
                    <span>TOTAL DUE (CASH):</span>
                    <span>{formatCurrency(selectedInvoice.totalAfterDiscount)}</span>
                  </div>
                </div>
                <div className="text-center text-[10px] text-slate-600">
                  <p className="font-semibold">PAYMENT: CASH ONLY</p>
                  <p className="italic">Thank you for shopping with us!</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>PRINT RECEIPT</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
