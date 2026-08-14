import { useState, useEffect } from 'react';
import { Printer, Search, FileText, Undo2, Calendar, User, Package } from 'lucide-react';
import { Badge, Table, type Column } from '../components/common';
import { invoicesService } from '../api/services/invoicesService';
import { productsService } from '../api/services/productsService';
import { apiClient } from '../api/client';
import type { Invoice, Product } from '../types';
import type { EmployeeOption } from '../types/app';
import { formatCurrency, formatDate } from '../utils';
import { PrintInvoiceModal } from '../components/invoices/PrintInvoiceModal';
import { ReturnExchangeModal } from '../components/invoices/ReturnExchangeModal';
import { hasPermission } from '../utils';
import { PermissionKeys } from '../types/employees';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterProductId, setFilterProductId] = useState('');
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadFilterData = async () => {
    try {
      const [prods, emps] = await Promise.all([
        productsService.getProducts(undefined, false), // Fetch all products, active and discontinued
        apiClient<any[]>('/api/Employees').catch(() => []),
      ]);
      setProducts(prods);
      if (Array.isArray(emps)) {
        setEmployees(
          emps.map((e) => ({
            id: Number(e.id) || 1,
            fullName: e.fullName || e.name || 'User',
            username: e.username || 'user',
            role: e.role || 'Cashier',
            isActive: e.isActive ?? true,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const filters = {
        date: filterDate || undefined,
        employeeId: filterEmployeeId || undefined,
        productId: filterProductId || undefined,
      };
      
      const data = await invoicesService.getInvoices(filters);
      setInvoices(data);
      
      if (selectedInvoice) {
        const updated = data.find((inv) => inv.id === selectedInvoice.id);
        if (updated) {
          setSelectedInvoice(updated);
        } else if (data.length > 0) {
          setSelectedInvoice(data[0]);
        } else {
          setSelectedInvoice(null);
        }
      } else if (data.length > 0) {
        setSelectedInvoice(data[0]);
      } else {
        setSelectedInvoice(null);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [filterDate, filterEmployeeId, filterProductId]);

  const resetFilters = () => {
    setFilterDate('');
    setFilterEmployeeId('');
    setFilterProductId('');
    setSearchTerm('');
  };

  // Client-side text filter on top of API queries
  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const canReturnOrExchange = hasPermission(PermissionKeys.InvoicesReturn) || hasPermission(PermissionKeys.InvoicesExchange);

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
      header: 'Status',
      cell: (inv) => {
        if (inv.isFullyReturned) {
          return <Badge variant="danger">Fully Returned</Badge>;
        }
        if (inv.hasReturn) {
          return <Badge variant="warning">Returned Items</Badge>;
        }
        return <Badge variant="success">Paid</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (inv) => (
        <div className="flex gap-1">
          <button
            onClick={() => {
              setSelectedInvoice(inv);
              setIsPrintModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          
          {canReturnOrExchange && !inv.isFullyReturned && (
            <button
              onClick={() => {
                setSelectedInvoice(inv);
                setIsReturnModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Return/Exch</span>
            </button>
          )}
        </div>
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
            <span>Invoices & Returns Registry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search invoices, filter by criteria, preview transactions, print thermal receipts, or process product returns/exchanges.
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

      {/* Advanced Filter Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Search & Advanced Filters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Text Search */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1">
              <Search className="w-3 h-3" />
              <span>Invoice # / Customer</span>
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. INV-1 or Walk-in"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Invoice Date</span>
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Cashier / Employee</span>
            </label>
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} (@{emp.username})
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>Contains Product</span>
            </label>
            <select
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit === 'package' ? 'Package' : 'Piece'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {(filterDate || filterEmployeeId || filterProductId || searchTerm) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl px-4 py-1.5 cursor-pointer transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Grid: Invoice List & Preview Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Invoices Table */}
        <div className="lg:col-span-7 space-y-4">
          <Table
            columns={columns}
            data={filteredInvoices}
            keyExtractor={(inv) => inv.id}
            emptyMessage={isLoading ? "Loading registry..." : "No invoices matching current filter criteria."}
          />
        </div>

        {/* Right: Selected Invoice Details & Receipt Preview Card */}
        <div className="lg:col-span-5">
          {selectedInvoice ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Selected Invoice</span>
                  <h3 className="text-base font-extrabold text-blue-600">{selectedInvoice.invoiceNumber}</h3>
                </div>
                <div>
                  {selectedInvoice.isFullyReturned ? (
                    <Badge variant="danger">Fully Returned</Badge>
                  ) : selectedInvoice.hasReturn ? (
                    <Badge variant="warning">Returned Items</Badge>
                  ) : (
                    <Badge variant="success">Saved</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
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
                  <p className="text-slate-600 font-medium">{formatDate(selectedInvoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Payment</p>
                  <p className="font-bold text-emerald-600">Cash Only</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Itemized Breakdown</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between text-xs hover:bg-slate-100 transition-colors">
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
                  <span className="font-semibold text-slate-800">{formatCurrency(selectedInvoice.totalBeforeDiscount)}</span>
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>OPEN PRINT PREVIEW / 80mm RECEIPT</span>
                </button>

                {canReturnOrExchange && !selectedInvoice.isFullyReturned && (
                  <button
                    onClick={() => setIsReturnModalOpen(true)}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>PROCESS RETURN / EXCHANGE (إرجاع أو تبديل)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 text-center min-h-[300px]">
              <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No Invoice Selected</p>
              <p className="text-[10px] text-slate-400">Click any invoice row to view transaction details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Thermal Receipt Modal */}
      {selectedInvoice && (
        <PrintInvoiceModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          invoice={selectedInvoice}
        />
      )}

      {/* Return/Exchange Modal */}
      {selectedInvoice && (
        <ReturnExchangeModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          invoice={selectedInvoice}
          products={products}
          onSuccess={loadInvoices}
        />
      )}
    </div>
  );
};
