import { apiClient } from '../client';
import type { Invoice, CreateInvoiceInput } from '../../types';

export const invoicesService = {
  async getInvoices(filters?: { date?: string; employeeId?: string; productId?: string }): Promise<Invoice[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.productId) params.append('productId', filters.productId);
      
      const queryStr = params.toString();
      const endpoint = `/api/Invoices${queryStr ? `?${queryStr}` : ''}`;
      
      const data = await apiClient<any[]>(endpoint);
      if (Array.isArray(data)) {
        return data.map((inv) => ({
          id: String(inv.id),
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
          employeeId: String(inv.employeeId || '1'),
          employeeName: inv.employeeName || 'Staff',
          customerName: inv.customerName || 'Walk-in Customer',
          items: Array.isArray(inv.items)
            ? inv.items.map((item: any) => ({
                productId: String(item.productId),
                productNameSnapshot: item.productNameSnapshot || item.productName || 'Product',
                unitPriceSnapshot: item.unitPriceSnapshot || item.unitPrice || 0,
                unit: item.unit === 'package' ? 'package' : 'piece',
                quantity: item.quantity || 1,
                lineTotal: item.lineTotal || 0,
              }))
            : [],
          totalBeforeDiscount: inv.totalBeforeDiscount || 0,
          discountPercentage: inv.discountPercentage || 0,
          totalAfterDiscount: inv.totalAfterDiscount || 0,
          hasReturn: Boolean(inv.hasReturn),
          isFullyReturned: Boolean(inv.isFullyReturned),
          createdAt: inv.createdAt || inv.date || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
    return [];
  },

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    try {
      const inv = await apiClient<any>(`/api/Invoices/${id}`);
      if (inv && inv.id) {
        return {
          id: String(inv.id),
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
          employeeId: String(inv.employeeId || '1'),
          employeeName: inv.employeeName || 'Staff',
          customerName: inv.customerName || 'Walk-in Customer',
          items: Array.isArray(inv.items)
            ? inv.items.map((item: any) => ({
                productId: String(item.productId),
                productNameSnapshot: item.productNameSnapshot || item.productName || 'Product',
                unitPriceSnapshot: item.unitPriceSnapshot || item.unitPrice || 0,
                unit: item.unit === 'package' ? 'package' : 'piece',
                quantity: item.quantity || 1,
                lineTotal: item.lineTotal || 0,
              }))
            : [],
          totalBeforeDiscount: inv.totalBeforeDiscount || 0,
          discountPercentage: inv.discountPercentage || 0,
          totalAfterDiscount: inv.totalAfterDiscount || 0,
          hasReturn: Boolean(inv.hasReturn),
          isFullyReturned: Boolean(inv.isFullyReturned),
          createdAt: inv.createdAt || inv.date || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error('Error fetching invoice by ID:', err);
    }
    return undefined;
  },

  async createInvoice(input: CreateInvoiceInput, employeeName: string = 'Current Employee'): Promise<Invoice> {
    const response = await apiClient<any>('/api/Invoices', {
      method: 'POST',
      body: JSON.stringify({
        items: input.items.map((i) => ({
          productId: Number(i.productId) || i.productId,
          quantity: i.quantity,
        })),
        discountPercentage: input.discountPercentage || 0,
        customerName: input.customerName || 'Walk-in Customer',
        employeeName,
      }),
    });

    return {
      id: String(response?.id || Date.now()),
      invoiceNumber: response?.invoiceNumber || `INV-${Date.now()}`,
      employeeId: '1',
      employeeName,
      customerName: input.customerName || 'Walk-in Customer',
      items: response?.items || [],
      totalBeforeDiscount: response?.totalBeforeDiscount || 0,
      discountPercentage: input.discountPercentage || 0,
      totalAfterDiscount: response?.totalAfterDiscount || 0,
      hasReturn: false,
      isFullyReturned: false,
      createdAt: new Date().toISOString(),
    };
  },
};
