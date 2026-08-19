import { apiClient } from '../client';

export interface SalesReportRow {
  date: string;
  totalInvoices: number;
  totalSalesBeforeDiscount: number;
  totalDiscountAmount: number;
  totalNetSales: number;
  totalReturnsAmount: number;
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
  async getSalesReport(fromDate?: string, toDate?: string, employeeId?: string): Promise<SalesReportRow[]> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (employeeId && employeeId !== 'all') params.append('employeeId', employeeId);
      
      const query = params.toString();
      const endpoint = `/api/Reports/sales${query ? `?${query}` : ''}`;
      const data = await apiClient<any[]>(endpoint);
      if (Array.isArray(data)) {
        return data.map((r) => ({
          date: r.date || r.day || new Date().toISOString().split('T')[0],
          totalInvoices: r.totalInvoices || r.invoiceCount || 0,
          totalSalesBeforeDiscount: r.totalSalesBeforeDiscount || r.grossSales || 0,
          totalDiscountAmount: r.totalDiscountAmount || r.discount || 0,
          totalNetSales: r.totalNetSales || r.netSales || 0,
          totalReturnsAmount: r.totalReturnsAmount || r.returnsAmount || 0,
        }));
      }
    } catch (err) {
      console.error('Error fetching sales report:', err);
    }
    return [];
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
        totalInvoicesCreated: e.totalInvoicesCreated || e.totalInvoices || e.invoiceCount || 0,
        totalSalesGenerated: e.totalSalesGenerated || e.totalSales || 0,
        netSalesGenerated: e.netSalesGenerated || e.netSales || 0,
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
        totalQuantitySold: p.totalQuantitySold || p.quantitySold || 0,
        totalRevenueGenerated: p.totalRevenueGenerated || p.totalRevenue || 0,
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
