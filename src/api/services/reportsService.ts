import { apiClient } from '../client';

export const reportsService = {
  async getSalesReport(fromDate?: string, toDate?: string, employeeId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (employeeId) params.append('employeeId', employeeId);
    
    const query = params.toString();
    const endpoint = `/api/reports/sales${query ? `?${query}` : ''}`;
    return apiClient<any>(endpoint);
  },

  async getInventoryReport(categoryId?: string, activeOnly?: string): Promise<any> {
    const params = new URLSearchParams();
    if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
    if (activeOnly) params.append('activeOnly', activeOnly);
    
    const query = params.toString();
    const endpoint = `/api/reports/inventory${query ? `?${query}` : ''}`;
    return apiClient<any>(endpoint);
  },

  async getAttendanceReport(fromDate?: string, toDate?: string, employeeId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (employeeId) params.append('employeeId', employeeId);
    
    const query = params.toString();
    const endpoint = `/api/reports/attendance${query ? `?${query}` : ''}`;
    return apiClient<any>(endpoint);
  },

  async getEmployeesReport(activeOnly?: string, role?: string): Promise<any> {
    const params = new URLSearchParams();
    if (activeOnly) params.append('activeOnly', activeOnly);
    if (role) params.append('role', role);
    
    const query = params.toString();
    const endpoint = `/api/reports/employees${query ? `?${query}` : ''}`;
    return apiClient<any>(endpoint);
  },

  async getEmployeeDetailReport(id: string, fromDate?: string, toDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    const query = params.toString();
    const endpoint = `/api/reports/employees/${id}${query ? `?${query}` : ''}`;
    return apiClient<any>(endpoint);
  },

  async getProductDetailReport(id: string, fromDate?: string, toDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    const query = params.toString();
    const endpoint = `/api/reports/products/${id}${query ? `?${query}` : ''}`;
    return apiClient<any>(endpoint);
  }
};
