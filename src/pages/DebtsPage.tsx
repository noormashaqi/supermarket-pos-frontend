import { useState, useEffect, type FormEvent } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Receipt,
  History,
  Phone,
  FileText,
  CreditCard,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { Modal, Table, type Column, ToastContainer, type ToastMessage } from '../components/common';
import { useModal } from '../hooks';
import { useSession } from '../hooks/useSession';
import { debtService } from '../api/services/debtService';
import { invoicesService } from '../api/services/invoicesService';
import type { DebtCustomer, DebtInvoice, DebtPayment, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { hasPermission } from '../utils/permissions';
import { AddCustomerModal } from '../components/pos/AddCustomerModal';
import { PrintInvoiceModal } from '../components/invoices/PrintInvoiceModal';

export const DebtsPage = () => {
  const [customers, setCustomers] = useState<DebtCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'settled'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Selected customer for Ledger / Statement view
  const [selectedCustomer, setSelectedCustomer] = useState<DebtCustomer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<DebtInvoice[]>([]);
  const [customerPayments, setCustomerPayments] = useState<DebtPayment[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Settle Debt Modal State
  const settleModal = useModal<DebtCustomer>();
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleNote, setSettleNote] = useState<string>('');
  const [isSettling, setIsSettling] = useState(false);

  // Add Customer Modal
  const addCustomerModal = useModal();

  // Print Invoice Modal
  const printModal = useModal<Invoice>();

  // Permissions & Session
  const { session } = useSession();
  const canManageDebt =
    hasPermission('customers.record_payment', session.permissions) ||
    hasPermission('invoices.debt_sale', session.permissions) ||
    hasPermission('debt.manage', session.permissions);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { id, type, message }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await debtService.getCustomers();
      setCustomers(data);
    } catch {
      addToast('error', 'Failed to load debt customers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Load customer details when selected
  const handleSelectCustomer = async (customer: DebtCustomer) => {
    setSelectedCustomer(customer);
    setIsLoadingDetails(true);
    try {
      const [invs, pymts] = await Promise.all([
        debtService.getDebtInvoices(customer.id),
        debtService.getDebtPayments(customer.id),
      ]);
      setCustomerInvoices(invs);
      setCustomerPayments(pymts);
    } catch {
      addToast('error', 'Failed to load customer debt history.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Open Settle Modal for a specific customer
  const handleOpenSettle = (customer: DebtCustomer) => {
    if (!canManageDebt) {
      addToast('error', '⛔ Access denied — "debt.manage" permission required.');
      return;
    }
    setSettleAmount(customer.totalOutstanding.toString());
    setSettleNote('');
    settleModal.open(customer);
  };

  // Handle Settle Form Submission
  const handleSettleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settleModal.data) return;

    const amount = Number(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast('error', 'Please enter a valid positive payment amount.');
      return;
    }

    if (amount > settleModal.data.totalOutstanding) {
      addToast('error', `Amount cannot exceed current outstanding debt (${formatCurrency(settleModal.data.totalOutstanding)}).`);
      return;
    }

    setIsSettling(true);
    try {
      const res = await debtService.settleDebt({
        customerId: settleModal.data.id,
        amount,
        note: settleNote.trim() || undefined,
      });

      if (res.success) {
        addToast(
          'success',
          `Successfully recorded payment of ${formatCurrency(amount)} for ${settleModal.data.nickname}. Remaining balance: ${formatCurrency(res.newOutstanding)}`
        );
        settleModal.close();
        await loadCustomers();
        if (selectedCustomer?.id === settleModal.data.id) {
          const updatedCust = await debtService.getCustomerById(settleModal.data.id);
          if (updatedCust) {
            handleSelectCustomer(updatedCust);
          }
        }
      }
    } catch (err: any) {
      addToast('error', `Settlement failed: ${err.message || 'Error occurred'}`);
    } finally {
      setIsSettling(false);
    }
  };

  // Handle opening an invoice in the print modal
  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const inv = await invoicesService.getInvoiceById(invoiceId);
      if (inv) {
        printModal.open(inv);
      } else {
        addToast('error', 'Invoice details not found.');
      }
    } catch {
      addToast('error', 'Failed to retrieve invoice details.');
    }
  };

  // Handle customer created from modal
  const handleCustomerCreated = (customer: DebtCustomer) => {
    setCustomers((prev) => [customer, ...prev]);
    addToast('success', `Customer "${customer.nickname}" added to Debt Notebook!`);
    handleSelectCustomer(customer);
  };

  // Metrics
  const totalOutstanding = customers.reduce((sum, c) => sum + c.totalOutstanding, 0);
  const totalDebtors = customers.filter((c) => c.totalOutstanding > 0).length;
  const settledCustomersCount = customers.filter((c) => c.totalOutstanding === 0).length;

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterType === 'active') return c.totalOutstanding > 0;
    if (filterType === 'settled') return c.totalOutstanding === 0;
    return true;
  });

  const columns: Column<DebtCustomer>[] = [
    {
      header: 'Customer / Nickname (الزبون / اللقب)',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
            c.totalOutstanding > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {c.nickname.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">{c.nickname}</p>
            {c.phone && (
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" />
                {c.phone}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Total Outstanding (إجمالي الدين)',
      cell: (c) => (
        <div>
          {c.totalOutstanding > 0 ? (
            <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-rose-500" />
              {formatCurrency(c.totalOutstanding)}
            </span>
          ) : (
            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Settled (خالص)
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Last Activity',
      cell: (c) => (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {formatDate(c.lastTransactionDate || '')}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (c) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectCustomer(c);
            }}
            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            <span>Ledger</span>
          </button>

          <button
            type="button"
            disabled={c.totalOutstanding <= 0 || !canManageDebt}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenSettle(c);
            }}
            title={!canManageDebt ? 'Requires debt.manage permission' : 'Settle or pay customer debt'}
            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors shadow-xs flex items-center gap-1"
          >
            <CreditCard className="w-3 h-3" />
            <span>Settle (سداد)</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Debt Notebook (دفتر الديون)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track customer credit balances, unpaid grocery tabs, and record settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addCustomerModal.open()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer / Debtor</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Total Outstanding Debt</p>
            <p className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(totalOutstanding)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Uncollected store receivables</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Debtors */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Active Debtors</p>
            <p className="text-2xl font-black text-amber-800 mt-1">{totalDebtors} Customers</p>
            <p className="text-[10px] text-slate-400 mt-0.5">With unpaid open balance</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Settled Customers */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Settled Customers</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{settledCustomersCount} Customers</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Zero outstanding balance</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* PERMISSION NOTICE BANNER IF CASHIER */}
      {!canManageDebt && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center gap-3 text-amber-800 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">View Only Mode</p>
            <p className="text-[11px] text-amber-700">
              Recording settlements or debt checkout requires payment permissions (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">customers.record_payment</code> or <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">invoices.debt_sale</code>).
            </p>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: CUSTOMERS LIST + LEDGER DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / MAIN COLUMN: CUSTOMER TABLE */}
        <div className={`${selectedCustomer ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-200`}>
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search debtor by nickname or phone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 font-medium"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('active')}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  filterType === 'active'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Debt Active ({totalDebtors})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('settled')}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  filterType === 'settled'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Settled ({settledCustomersCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <Table
              columns={columns}
              data={filteredCustomers}
              keyExtractor={(c) => c.id}
              emptyMessage={isLoading ? 'Loading customers...' : 'No debt customers match your search.'}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER LEDGER & STATEMENT (when a customer is clicked) */}
        {selectedCustomer && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col space-y-4">
            {/* Header with Customer Summary */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {selectedCustomer.nickname.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{selectedCustomer.nickname}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {selectedCustomer.phone ? `Phone: ${selectedCustomer.phone}` : 'No phone registered'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Total Balance Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 p-4 rounded-xl border border-amber-200 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Current Unpaid Balance
                </p>
                <p className="text-xl font-black text-amber-900 mt-0.5">
                  {formatCurrency(selectedCustomer.totalOutstanding)}
                </p>
              </div>

              {selectedCustomer.totalOutstanding > 0 && (
                <button
                  type="button"
                  disabled={!canManageDebt}
                  onClick={() => handleOpenSettle(selectedCustomer)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-40"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settle Debt</span>
                </button>
              )}
            </div>

            {/* Tabs: Invoices vs Payment History */}
            <div className="flex gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'invoices'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Debt Invoices ({customerInvoices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Payment Log ({customerPayments.length})</span>
              </button>
            </div>

            {/* Tab Content List */}
            <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1">
              {isLoadingDetails ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  Loading customer records...
                </div>
              ) : activeTab === 'invoices' ? (
                customerInvoices.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                    <Receipt className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs font-bold text-slate-600">No debt invoices recorded</p>
                    <p className="text-[10px] text-slate-400">Invoices marked as 'Debt' at POS checkout appear here.</p>
                  </div>
                ) : (
                  customerInvoices.map((inv) => (
                    <div
                      key={inv.invoiceId}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex justify-between items-center"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          {inv.isPaid ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              PAID
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              UNPAID
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{formatDate(inv.date)}</p>
                        <p className="text-[11px] text-slate-600">
                          Original: <span className="font-semibold">{formatCurrency(inv.originalAmount)}</span> | Balance: <span className="font-bold text-rose-600">{formatCurrency(inv.remainingBalance)}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleViewInvoice(inv.invoiceId)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="View / Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )
              ) : (
                customerPayments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                    <History className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs font-bold text-slate-600">No payment records yet</p>
                    <p className="text-[10px] text-slate-400">Settlements recorded for this customer will appear here.</p>
                  </div>
                ) : (
                  customerPayments.map((pymt) => (
                    <div
                      key={pymt.id}
                      className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 flex justify-between items-center"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700">
                            +{formatCurrency(pymt.amount)}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Settlement
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{formatDate(pymt.date)}</p>
                        {pymt.note && (
                          <p className="text-[11px] text-slate-600 italic">"{pymt.note}"</p>
                        )}
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── SETTLE DEBT MODAL ─── */}
      <Modal
        isOpen={settleModal.isOpen}
        onClose={settleModal.close}
        title={`Settle Debt: ${settleModal.data?.nickname || ''}`}
        maxWidth="md"
      >
        {settleModal.data && (
          <form onSubmit={handleSettleSubmit} className="space-y-4">
            {/* Summary Box */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs space-y-1">
              <div className="flex justify-between text-amber-900">
                <span>Customer:</span>
                <span className="font-bold">{settleModal.data.nickname}</span>
              </div>
              <div className="flex justify-between text-amber-900 font-bold text-sm border-t border-amber-200 pt-1 mt-1">
                <span>Total Outstanding:</span>
                <span className="text-rose-700">{formatCurrency(settleModal.data.totalOutstanding)}</span>
              </div>
            </div>

            {/* Quick Settle Amount Shortcuts */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                Quick Shortcuts (اختصارات سريعة)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettleAmount(settleModal.data!.totalOutstanding.toString())}
                  className="flex-1 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                >
                  Pay Full ({formatCurrency(settleModal.data.totalOutstanding)})
                </button>
                <button
                  type="button"
                  onClick={() => setSettleAmount((settleModal.data!.totalOutstanding / 2).toFixed(2))}
                  className="flex-1 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 cursor-pointer"
                >
                  Pay 50%
                </button>
              </div>
            </div>

            {/* Payment Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Payment Amount (مبلغ السداد) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={settleModal.data.totalOutstanding}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Live Remaining Balance Calculation */}
            {Number(settleAmount) > 0 && (
              <div className="flex justify-between items-center text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">Estimated Remaining Balance:</span>
                <span className="font-bold text-rose-600">
                  {formatCurrency(Math.max(0, settleModal.data.totalOutstanding - (Number(settleAmount) || 0)))}
                </span>
              </div>
            )}

            {/* Note / Memo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Note / Payment Memo (ملاحظات السداد)
              </label>
              <input
                type="text"
                value={settleNote}
                onChange={(e) => setSettleNote(e.target.value)}
                placeholder="e.g. Cash received at register by Ahmad"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={settleModal.close}
                disabled={isSettling}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSettling || !settleAmount || Number(settleAmount) <= 0}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSettling ? 'Processing...' : 'Confirm Settlement'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={addCustomerModal.isOpen}
        onClose={addCustomerModal.close}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* Print Invoice Modal */}
      <PrintInvoiceModal
        isOpen={printModal.isOpen}
        onClose={printModal.close}
        invoice={printModal.data}
      />
    </div>
  );
};
