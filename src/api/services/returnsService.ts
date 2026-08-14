import { apiClient } from '../client';
import type { ReturnRecord } from '../../types';

export const returnsService = {
  async executePureReturn(input: {
    originalInvoiceId: string;
    productId: string;
    quantityReturned: number;
    reason: string;
  }, employeeName: string = 'Current Employee'): Promise<ReturnRecord> {
    const res = await apiClient<any>(`/api/Invoices/${input.originalInvoiceId}/return`, {
      method: 'POST',
      body: JSON.stringify({
        productId: Number(input.productId) || input.productId,
        quantityReturned: input.quantityReturned,
        reason: input.reason,
        employeeName,
      }),
    });

    return {
      id: String(res?.id || Date.now()),
      originalInvoiceId: input.originalInvoiceId,
      originalInvoiceNumber: res?.originalInvoiceNumber || `INV-${input.originalInvoiceId}`,
      type: 'PureReturn',
      productId: input.productId,
      productName: res?.productName || 'Returned Product',
      quantityReturned: input.quantityReturned,
      employeeId: '1',
      employeeName,
      createdAt: new Date().toISOString(),
      reason: input.reason,
    };
  },

  async executeExchange(input: {
    originalInvoiceId: string;
    productId: string;
    quantityReturned: number;
    newItems: Array<{ productId: string; quantity: number }>;
    reason: string;
  }, employeeName: string = 'Current Employee'): Promise<{ returnRecord: ReturnRecord; newInvoiceId?: string }> {
    const res = await apiClient<any>(`/api/Invoices/${input.originalInvoiceId}/exchange`, {
      method: 'POST',
      body: JSON.stringify({
        productId: Number(input.productId) || input.productId,
        quantityReturned: input.quantityReturned,
        newItems: input.newItems.map((item) => ({
          productId: Number(item.productId) || item.productId,
          quantity: item.quantity,
        })),
        reason: input.reason,
        employeeName,
      }),
    });

    const newInvId = res?.newInvoiceId ? String(res.newInvoiceId) : String(Date.now());

    return {
      returnRecord: {
        id: String(res?.id || Date.now()),
        originalInvoiceId: input.originalInvoiceId,
        originalInvoiceNumber: res?.originalInvoiceNumber || `INV-${input.originalInvoiceId}`,
        type: 'Exchange',
        productId: input.productId,
        productName: res?.productName || 'Exchanged Product',
        quantityReturned: input.quantityReturned,
        newInvoiceId: newInvId,
        employeeId: '1',
        employeeName,
        createdAt: new Date().toISOString(),
        reason: input.reason,
      },
      newInvoiceId: newInvId,
    };
  },

  async executeExchangeReturn(input: any, employeeName: string = 'Current Employee') {
    return this.executeExchange(input, employeeName);
  },

  async getReturnHistory(invoiceId?: string): Promise<ReturnRecord[]> {
    try {
      let endpoint = '/api/Returns';
      if (invoiceId) {
        endpoint += `?invoiceId=${invoiceId}`;
      }
      const data = await apiClient<any[]>(endpoint);
      if (Array.isArray(data)) {
        return data.map((r) => ({
          id: String(r.id),
          originalInvoiceId: String(r.originalInvoiceId),
          originalInvoiceNumber: r.originalInvoiceNumber || `INV-${r.originalInvoiceId}`,
          type: r.type === 'Exchange' ? 'Exchange' : 'PureReturn',
          productId: String(r.productId),
          productName: r.productName || 'Product',
          quantityReturned: r.quantityReturned || 1,
          newInvoiceId: r.newInvoiceId ? String(r.newInvoiceId) : undefined,
          employeeId: String(r.employeeId || '1'),
          employeeName: r.employeeName || 'Staff',
          createdAt: r.createdAt || r.date || new Date().toISOString(),
          reason: r.reason || '',
        }));
      }
    } catch (err) {
      console.error('Error fetching return history:', err);
    }
    return [];
  },
};
