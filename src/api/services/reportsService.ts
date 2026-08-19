import { apiClient } from '../client';

export interface SalesReportRow {
  date: string;
  totalInvoices: number;
  totalSalesBeforeDiscount: number;
  totalDiscountAmount: number;
  totalNetSales: number;
  totalReturnsAmount: number;
  invoiceNumber?: string;
  customerName?: string;
  employeeName?: string;
}

export interface SalesReportSummary {
  netSales: number;
  invoiceCount: number;
  totalReturnedAmount: number;
  totalSalesBeforeDiscount: number;
  totalDiscountAmount: number;
  invoices: SalesReportRow[];
}

export interface EmployeeReportData {
  employeeId: string;
  employeeName: string;
  totalInvoicesCreated: number;
  totalSalesGenerated: number;
  netSalesGenerated: number;
}

export interface ProductReportRow {
  productId: string;
  productName: string;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenueGenerated: number;
  unit: string;
}

export const reportsService = {
  async getSalesReport(
    fromDate?: string,
    toDate?: string,
    employeeId?: string
  ): Promise<{ summary: SalesReportSummary; rows: SalesReportRow[] }> {
    const emptyResult = {
      summary: {
        netSales: 0,
        invoiceCount: 0,
        totalReturnedAmount: 0,
        totalSalesBeforeDiscount: 0,
        totalDiscountAmount: 0,
        invoices: [],
      },
      rows: [],
    };

    try {
      const params = new URLSearchParams();
      if (fromDate) {
        params.append('from', fromDate);
        params.append('fromDate', fromDate);
      }
      if (toDate) {
        params.append('to', toDate);
        params.append('toDate', toDate);
      }
      if (employeeId && employeeId !== 'all') params.append('employeeId', employeeId);

      const query = params.toString();
      const endpoints = [
        `/api/Reports/sales${query ? `?${query}` : ''}`,
        `/api/reports/sales${query ? `?${query}` : ''}`,
      ];

      let data: any = null;
      for (const ep of endpoints) {
        try {
          data = await apiClient<any>(ep);
          if (data) break;
        } catch {
          // try next
        }
      }

      if (data) {
        // If API returned an array of row objects
        if (Array.isArray(data)) {
          const rows: SalesReportRow[] = data.map((r) => ({
            date: r.date || r.createdAt || r.day || r.invoiceNumber || new Date().toISOString().split('T')[0],
            totalInvoices: Number(r.invoiceCount ?? r.totalInvoices ?? 1),
            totalSalesBeforeDiscount: Number(r.totalSalesBeforeDiscount ?? r.grossSales ?? r.totalBeforeDiscount ?? 0),
            totalDiscountAmount: Number(r.totalDiscountAmount ?? r.discountAmount ?? r.discount ?? 0),
            totalNetSales: Number(r.netSales ?? r.totalNetSales ?? r.totalAfterDiscount ?? 0),
            totalReturnsAmount: Number(r.totalReturnedAmount ?? r.totalReturnsAmount ?? r.returnsAmount ?? 0),
            invoiceNumber: r.invoiceNumber,
            customerName: r.customerName,
            employeeName: r.employeeName,
          }));

          const summary: SalesReportSummary = {
            netSales: rows.reduce((s, r) => s + r.totalNetSales, 0),
            invoiceCount: rows.reduce((s, r) => s + r.totalInvoices, 0),
            totalReturnedAmount: rows.reduce((s, r) => s + r.totalReturnsAmount, 0),
            totalSalesBeforeDiscount: rows.reduce((s, r) => s + r.totalSalesBeforeDiscount, 0),
            totalDiscountAmount: rows.reduce((s, r) => s + r.totalDiscountAmount, 0),
            invoices: rows,
          };

          return { summary, rows };
        }

        // If API returned a summary object containing { netSales, invoiceCount, totalReturnedAmount, invoices }
        const rawInvoices = Array.isArray(data.invoices) ? data.invoices : Array.isArray(data.items) ? data.items : [];
        const rows: SalesReportRow[] = rawInvoices.map((r: any) => ({
          date: r.date || r.createdAt || r.day || r.invoiceNumber || new Date().toISOString().split('T')[0],
          totalInvoices: Number(r.invoiceCount ?? r.totalInvoices ?? 1),
          totalSalesBeforeDiscount: Number(r.totalSalesBeforeDiscount ?? r.grossSales ?? r.totalBeforeDiscount ?? 0),
          totalDiscountAmount: Number(r.totalDiscountAmount ?? r.discountAmount ?? r.discount ?? 0),
          totalNetSales: Number(r.netSales ?? r.totalNetSales ?? r.totalAfterDiscount ?? 0),
          totalReturnsAmount: Number(r.totalReturnedAmount ?? r.totalReturnsAmount ?? r.returnsAmount ?? 0),
          invoiceNumber: r.invoiceNumber,
          customerName: r.customerName,
          employeeName: r.employeeName,
        }));

        const summary: SalesReportSummary = {
          netSales: Number(data.netSales ?? data.totalNetSales ?? rows.reduce((s, r) => s + r.totalNetSales, 0)),
          invoiceCount: Number(data.invoiceCount ?? data.totalInvoices ?? rows.reduce((s, r) => s + r.totalInvoices, 0)),
          totalReturnedAmount: Number(data.totalReturnedAmount ?? data.totalReturnsAmount ?? rows.reduce((s, r) => s + r.totalReturnsAmount, 0)),
          totalSalesBeforeDiscount: Number(data.totalSalesBeforeDiscount ?? rows.reduce((s, r) => s + r.totalSalesBeforeDiscount, 0)),
          totalDiscountAmount: Number(data.totalDiscountAmount ?? rows.reduce((s, r) => s + r.totalDiscountAmount, 0)),
          invoices: rows,
        };

        return { summary, rows };
      }
    } catch (err) {
      console.error('Error fetching sales report:', err);
    }

    return emptyResult;
  },

  async getEmployeeReport(employeeId?: string, fromDate?: string, toDate?: string): Promise<EmployeeReportData[]> {
    try {
      let endpoint = '/api/Reports/employees';
      if (employeeId && employeeId !== 'all') {
        endpoint += `/${employeeId}`;
      }
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const data = await apiClient<any>(endpoint);
      const list = Array.isArray(data) ? data : data ? [data] : [];
      return list.map((e) => ({
        employeeId: String(e.employeeId || e.id || '1'),
        employeeName: e.employeeName || e.fullName || e.name || 'Employee',
        totalInvoicesCreated: Number(e.totalInvoicesCreated ?? e.totalInvoices ?? e.invoiceCount ?? 0),
        totalSalesGenerated: Number(e.totalSalesGenerated ?? e.totalSales ?? e.grossSales ?? 0),
        netSalesGenerated: Number(e.netSalesGenerated ?? e.netSales ?? 0),
      }));
    } catch (err) {
      console.error('Error fetching employee report:', err);
    }
    return [];
  },

  async getEmployeesReport(_activeOnly?: string, _role?: string): Promise<any> {
    return this.getEmployeeReport();
  },

  async getProductReport(productId?: string, fromDate?: string, toDate?: string): Promise<ProductReportRow[]> {
    try {
      let endpoint = '/api/Reports/products';
      if (productId && productId !== 'all') {
        endpoint += `/${productId}`;
      }
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const data = await apiClient<any>(endpoint);
      const list = Array.isArray(data) ? data : data ? [data] : [];
      return list.map((p) => ({
        productId: String(p.productId || p.id || '1'),
        productName: p.productName || p.name || 'Product',
        categoryName: p.categoryName || 'General',
        totalQuantitySold: Number(p.totalQuantitySold ?? p.quantitySold ?? 0),
        totalRevenueGenerated: Number(p.totalRevenueGenerated ?? p.totalRevenue ?? p.netSales ?? 0),
        unit: (p.unit && p.unit.toLowerCase() === 'package') ? 'package' : 'piece',
      }));
    } catch (err) {
      console.error('Error fetching product report:', err);
    }
    return [];
  },

  async getInventoryReport(categoryId?: string, _activeOnly?: string): Promise<any> {
    return this.getProductReport(categoryId);
  },

  async getAttendanceReport(_fromDate?: string, _toDate?: string, _employeeId?: string): Promise<any> {
    return [];
  },

  async getEmployeeDetailReport(id: string, fromDate?: string, toDate?: string): Promise<any> {
    return this.getEmployeeReport(id, fromDate, toDate);
  },

  async getProductDetailReport(id: string, fromDate?: string, toDate?: string): Promise<any> {
    return this.getProductReport(id, fromDate, toDate);
  }
};
