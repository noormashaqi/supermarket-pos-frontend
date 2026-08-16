import { apiClient } from '../client';
import type { 
  ReturnRecord, 
  ExecutePureReturnInput, 
  ExecuteExchangeInput 
} from '../../types';

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
    input: ExecuteExchangeInput,
    employeeName: string = 'Current Employee'
  ): Promise<{ returnRecord: ReturnRecord; newInvoiceId?: string }> {

    // 1) تحديد معرّف الصنف المرتجع (القديم)
    const oldProductId = Number(
      input.oldProductId ?? input.productIdToReturn ?? input.productId
    );

    // 2) تجهيز قائمة الأصناف البديلة (NewItems)
    const newItems = input.newItems && input.newItems.length > 0
      ? input.newItems.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
        }))
      : [
          {
            productId: Number(input.replacementProductId),
            quantity: input.replacementQuantity || 1,
          },
        ];

    // 3) بناء الـ Payload بنفس أسماء خصائص ExchangeRequestBody في C#
    const payload = {
      oldProductId,
      quantityReturned: input.quantityReturned,
      newItems,
      reason: input.reason || '',
    };

    const res = await apiClient<any>(`/api/Invoices/${input.originalInvoiceId}/exchange`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const newInvId = res?.newInvoiceId ? String(res.newInvoiceId) : undefined;
    const newInvNumber = res?.newInvoiceNumber || undefined;

    return {
      returnRecord: {
        id: String(res?.returnId || res?.id || Date.now()),
        originalInvoiceId: String(input.originalInvoiceId),
        originalInvoiceNumber: res?.originalInvoiceNumber || `INV-${input.originalInvoiceId}`,
        type: 'Exchange',
        productId: String(oldProductId),
        productName: res?.productName || 'Exchanged Product',
        quantityReturned: input.quantityReturned,
        newInvoiceId: newInvId,
        newInvoiceNumber: newInvNumber,
        employeeId: '1',
        employeeName,
        createdAt: new Date().toISOString(),
        reason: input.reason,
      },
      newInvoiceId: newInvId,
    };
  },

  async executeExchangeReturn(input: ExecuteExchangeInput, employeeName: string = 'Current Employee') {
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