import { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  Package,
  Printer,
  Filter,
} from 'lucide-react';
import {
  reportsService,
  type SalesReportRow,
  type SalesReportSummary,
  type EmployeeReportData,
  type ProductReportRow,
} from '../api/services/reportsService';
import { employeesService } from '../api/services/employeeService';
import { productsService } from '../api/services/productsService';
import type { EmployeeOption } from '../types/app';
import type { Product } from '../types';
import { Badge, Table, type Column } from '../components/common';
import { formatCurrency } from '../utils';

type ReportTab = 'sales' | 'employee' | 'product';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');

  const [employeesList, setEmployeesList] = useState<EmployeeOption[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [salesReportData, setSalesReportData] = useState<SalesReportRow[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesReportSummary>({
    netSales: 0,
    invoiceCount: 0,
    totalReturnedAmount: 0,
    totalSalesBeforeDiscount: 0,
    totalDiscountAmount: 0,
    invoices: [],
  });

  const [employeeReportData, setEmployeeReportData] = useState<EmployeeReportData[]>([]);
  const [productReportData, setProductReportData] = useState<ProductReportRow[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadDropdowns = async () => {
    try {
      const [emps, prods] = await Promise.all([
        employeesService.getEmployees().catch(() => []),
        productsService.getProducts().catch(() => []),
      ]);

      setEmployeesList(
        emps.map((e) => ({
          id: Number(e.id) || 1,
          fullName: e.fullName || 'Employee',
          username: e.username || 'user',
          role: e.role || 'Cashier',
          isActive: e.isActive ?? true,
        }))
      );
      setProductsList(prods);
    } catch {
      // fallback
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'sales') {
        const { summary, rows } = await reportsService.getSalesReport(
          fromDate || undefined,
          toDate || undefined
        );
        setSalesSummary(summary);
        setSalesReportData(rows.length > 0 ? rows : summary.invoices);
      } else if (activeTab === 'employee') {
        const data = await reportsService.getEmployeeReport(selectedEmployeeId);
        setEmployeeReportData(data);
      } else if (activeTab === 'product') {
        const data = await reportsService.getProductReport(selectedProductId);
        setProductReportData(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [activeTab, fromDate, toDate, selectedEmployeeId, selectedProductId]);

  // Fallback Calculations for Header Summaries
  const displayNetSales = salesSummary.netSales || salesReportData.reduce((acc, row) => acc + row.totalNetSales, 0);
  const displayInvoiceCount = salesSummary.invoiceCount || salesReportData.reduce((acc, row) => acc + row.totalInvoices, 0);
  const displayReturnedAmount = salesSummary.totalReturnedAmount || salesReportData.reduce((acc, row) => acc + row.totalReturnsAmount, 0);

  const salesColumns: Column<SalesReportRow>[] = [
    {
      header: 'Date / Period',
      cell: (r) => (
        <span className="font-bold text-slate-800 text-xs">
          {r.invoiceNumber ? `#${r.invoiceNumber}` : r.date}
        </span>
      ),
    },
    {
      header: 'Invoices Count',
      cell: (r) => <span className="text-xs font-semibold text-slate-700">{r.totalInvoices}</span>,
    },
    {
      header: 'Gross Sales',
      cell: (r) => (
        <span className="text-xs font-medium text-slate-600">
          {formatCurrency(r.totalSalesBeforeDiscount)}
        </span>
      ),
    },
    {
      header: 'Discount Total',
      cell: (r) => (
        <span className="text-xs font-medium text-amber-600">
          -{formatCurrency(r.totalDiscountAmount)}
        </span>
      ),
    },
    {
      header: 'Returns Amount',
      cell: (r) => (
        <span className="text-xs font-medium text-rose-600">
          -{formatCurrency(r.totalReturnsAmount)}
        </span>
      ),
    },
    {
      header: 'Net Sales (المبيعات الصافية)',
      cell: (r) => (
        <span className="text-xs font-extrabold text-emerald-700">
          {formatCurrency(r.totalNetSales)}
        </span>
      ),
    },
  ];

  const employeeColumns: Column<EmployeeReportData>[] = [
    {
      header: 'Employee Name',
      cell: (e) => <span className="font-bold text-slate-800 text-xs">{e.employeeName}</span>,
    },
    {
      header: 'Invoices Issued',
      cell: (e) => <span className="text-xs font-semibold text-slate-700">{e.totalInvoicesCreated} Receipts</span>,
    },
    {
      header: 'Gross Sales',
      cell: (e) => (
        <span className="text-xs font-medium text-slate-600">
          {formatCurrency(e.totalSalesGenerated)}
        </span>
      ),
    },
    {
      header: 'Net Sales',
      cell: (e) => (
        <span className="text-xs font-extrabold text-emerald-700">
          {formatCurrency(e.netSalesGenerated)}
        </span>
      ),
    },
  ];

  const productColumns: Column<ProductReportRow>[] = [
    {
      header: 'Product Name',
      cell: (p) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{p.productName}</p>
          <span className="text-[10px] text-slate-400">{p.categoryName}</span>
        </div>
      ),
    },
    {
      header: 'Unit',
      cell: (p) => (
        <Badge variant={p.unit === 'package' ? 'info' : 'warning'}>
          {p.unit === 'package' ? 'Package (باكيج)' : 'Piece (حبة)'}
        </Badge>
      ),
    },
    {
      header: 'Quantity Sold',
      cell: (p) => (
        <span className="text-xs font-extrabold text-slate-900">
          {p.totalQuantitySold} {p.unit}s
        </span>
      ),
    },
    {
      header: 'Total Revenue',
      cell: (p) => (
        <span className="text-xs font-extrabold text-emerald-700">
          {formatCurrency(p.totalRevenueGenerated)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-30 rounded-2xl">
          <div className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
            <span>Calculating report data...</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Sales & Analytics Reports (تقارير المبيعات)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive business reports by date range, per-employee performance, and top sold product analytics.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer print:hidden"
        >
          <Printer className="w-4 h-4" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Summary Analytics Cards for Sales Mode */}
      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase block">Total Net Sales (netSales)</span>
            <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(displayNetSales)}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase block">Total Invoices (invoiceCount)</span>
            <p className="text-2xl font-extrabold text-slate-900">{displayInvoiceCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase block">Total Deducted Returns (totalReturnedAmount)</span>
            <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(displayReturnedAmount)}</p>
          </div>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sales Report by Date (تقرير المبيعات حسب التاريخ)</span>
          </button>

          <button
            onClick={() => setActiveTab('employee')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'employee'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Per-Employee Sales Report (حسب الموظف)</span>
          </button>

          <button
            onClick={() => setActiveTab('product')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'product'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Per-Product Sales Report (حسب الصنف)</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Report Filters:</span>
          </div>

          {activeTab === 'sales' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">From:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">To:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear Date Filters
                </button>
              )}
            </>
          )}

          {activeTab === 'employee' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Select Employee:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees (جميع الموظفين)</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} (@{emp.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'product' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Select Product:</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products (جميع الأصناف)</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Report Table View */}
      {activeTab === 'sales' && (
        <Table
          columns={salesColumns}
          data={salesReportData}
          keyExtractor={(r: SalesReportRow) => r.invoiceNumber || r.date}
          emptyMessage="No sales data found for the selected date range."
        />
      )}

      {activeTab === 'employee' && (
        <Table
          columns={employeeColumns}
          data={employeeReportData}
          keyExtractor={(e) => String(e.employeeId)}
          emptyMessage="No employee sales records found."
        />
      )}

      {activeTab === 'product' && (
        <Table
          columns={productColumns}
          data={productReportData}
          keyExtractor={(p) => String(p.productId)}
          emptyMessage="No product sales records found."
        />
      )}
    </div>
  );
};
