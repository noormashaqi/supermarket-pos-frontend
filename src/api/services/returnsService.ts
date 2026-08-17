import { apiClient } from '../client';
import type { 
  ReturnRecord, 
  ExecutePureReturnInput, 
  ExecuteExchangeInput 
} from '../../types';

export interface ExchangeInvoicePayload {
  originalInvoiceId: number;
  returnedItems: Array<{ productId: number; quantity: number }>;
  newItems: Array<{ productId: number; quantity: number; unitPrice: number }>;
  reason?: string;
}

export const returnsService = {
  async executePureReturn(
    input: ExecutePureReturnInput,
    employeeName: string = 'Current Employee'
  ): Promise<ReturnRecord> {
    const res = await apiClient<any>(`/api/Invoices/${input.originalInvoiceId}/return`, {
      method: 'POST',
      body: JSON.stringify({
        productId: Number(input.productId),
        quantityReturned: input.quantityReturned,
        reason: input.reason || '',
        employeeName,
      }),
    });

    return {
      id: String(res?.id || res?.returnId || Date.now()),
      originalInvoiceId: input.originalInvoiceId,
      originalInvoiceNumber: res?.originalInvoiceNumber || `INV-${input.originalInvoiceId}`,
      type: 'PureReturn',
      productId: String(input.productId),
      productName: res?.productName || 'Returned Product',
      quantityReturned: input.quantityReturned,
      employeeId: '1',
      employeeName,
      createdAt: new Date().toISOString(),
      reason: input.reason,
    };
  },

  async executeExchange(
    input: ExecuteExchangeInput | ExchangeInvoicePayload,
    employeeName: string = 'Current Employee'
  ): Promise<{ returnRecord: ReturnRecord; newInvoiceId?: string }> {

    const originalInvoiceId = Number((input as any).originalInvoiceId);
    
    // 1) Extract returned items matching backend DTO schema
    let returnedItems: Array<{ productId: number; quantity: number }> = (input as any).returnedItems;
    let oldProductId = Number((input as any).oldProductId ?? (input as any).productIdToReturn ?? (input as any).productId ?? 1);
    let quantityReturned = Number((input as any).quantityReturned ?? 1);

    if (!returnedItems || returnedItems.length === 0) {
      returnedItems = [
        {
          productId: oldProductId,
          quantity: quantityReturned,
        },
      ];
    } else {
      oldProductId = returnedItems[0].productId;
      quantityReturned = returnedItems[0].quantity;
    }

    // 2) Extract replacement items matching backend DTO schema
    let rawNewItems: any[] = (input as any).newItems;
    let newItems: Array<{ productId: number; quantity: number; unitPrice: number }>;

    if (Array.isArray(rawNewItems) && rawNewItems.length > 0) {
      newItems = rawNewItems.map((item: any) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice || item.price || 0),
      }));
    } else {
      newItems = [
        {
          productId: Number((input as any).replacementProductId),
          quantity: Number((input as any).replacementQuantity || 1),
          unitPrice: Number((input as any).unitPrice || 0),
        },
      ];
    }

    // 3) Construct payload strictly matching ExchangeInvoicePayload backend DTO schema
    const payload: ExchangeInvoicePayload = {
      originalInvoiceId,
      returnedItems,
      newItems,
      reason: (input as any).reason || '',
    };

    const res = await apiClient<any>(`/api/Invoices/${originalInvoiceId}/exchange`, {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        // Include legacy fallback fields for maximum backend compatibility
        oldProductId,
        quantityReturned,
      }),
    });

    const newInvId = res?.newInvoiceId ? String(res.newInvoiceId) : undefined;
    const newInvNumber = res?.newInvoiceNumber || undefined;

    return {
      returnRecord: {
        id: String(res?.returnId || res?.id || Date.now()),
        originalInvoiceId: String(originalInvoiceId),
        originalInvoiceNumber: res?.originalInvoiceNumber || `INV-${originalInvoiceId}`,
        type: 'Exchange',
        productId: String(oldProductId),
        productName: res?.productName || 'Exchanged Product',
        quantityReturned,
        newInvoiceId: newInvId,
        newInvoiceNumber: newInvNumber,
        employeeId: '1',
        employeeName,
        createdAt: new Date().toISOString(),
        reason: (input as any).reason,
      },
      newInvoiceId: newInvId,
    };
  },

  async executeExchangeReturn(input: ExecuteExchangeInput | ExchangeInvoicePayload, employeeName: string = 'Current Employee') {
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
          newInvoiceNumber: r.newInvoiceNumber,
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