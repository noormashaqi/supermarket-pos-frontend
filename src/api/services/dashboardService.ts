import { apiClient } from '../client';

export interface DashboardSummary {
  todaySales: number;
  invoiceCount: number;
  lowStockProductCount: number;
  outOfStockProductCount: number;
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const res = await apiClient<any>('/api/Dashboard/summary');
      return {
        todaySales: res?.todaySales ?? res?.todayTotalSales ?? 0,
        invoiceCount: res?.invoiceCount ?? res?.todayInvoiceCount ?? 0,
        lowStockProductCount: res?.lowStockProductCount ?? res?.lowStockCount ?? 0,
        outOfStockProductCount: res?.outOfStockProductCount ?? res?.outOfStockCount ?? 0,
      };
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      return {
        todaySales: 0,
        invoiceCount: 0,
        lowStockProductCount: 0,
        outOfStockProductCount: 0,
      };
    }
  },
};
