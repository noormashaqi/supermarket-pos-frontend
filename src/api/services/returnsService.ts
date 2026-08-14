import { apiClient } from '../client';
import type { ReturnRecord, ExecutePureReturnInput, ExecuteExchangeInput } from '../../types';
import { invoicesService } from './invoicesService';
import { productsService } from './productsService';

let mockReturns: ReturnRecord[] = [];

export const returnsService = {
  async getReturns(): Promise<ReturnRecord[]> {
    return [...mockReturns];
  },

  async executePureReturn(input: ExecutePureReturnInput, employeeName: string = 'Cashier'): Promise<ReturnRecord> {
    try {
      await apiClient(`/api/invoices/${input.originalInvoiceId}/return`, {
        method: 'POST',
        body: JSON.stringify({
          productId: Number(input.productId),
          quantityReturned: input.quantityReturned,
          reason: input.reason,
        }),
      });
    } catch {
      // fallback
    }

    // 1. Stock quantity restored (Stock In)
    await productsService.addStock(
      {
        productId: input.productId,
        quantityAdded: input.quantityReturned,
        reason: `Pure Return for Invoice #${input.originalInvoiceId}`,
      },
      employeeName
    );

    // 2. Original invoice tagged as hasReturn
    const originalInvoice = await invoicesService.getInvoiceById(input.originalInvoiceId);
    if (originalInvoice) {
      originalInvoice.hasReturn = true;
    }

    const prod = await productsService.getProductById(input.productId);

    const record: ReturnRecord = {
      id: `ret-${Date.now()}`,
      originalInvoiceId: input.originalInvoiceId,
      originalInvoiceNumber: originalInvoice?.invoiceNumber || `INV-${input.originalInvoiceId}`,
      type: 'PureReturn',
      productId: input.productId,
      productName: prod?.name || 'Returned Product',
      quantityReturned: input.quantityReturned,
      employeeId: 'emp-1',
      employeeName,
      reason: input.reason || 'Customer Return',
      createdAt: new Date().toISOString(),
    };

    mockReturns.unshift(record);
    return record;
  },

  async executeExchange(input: ExecuteExchangeInput, employeeName: string = 'Cashier'): Promise<ReturnRecord> {
    try {
      await apiClient(`/api/invoices/${input.originalInvoiceId}/exchange`, {
        method: 'POST',
        body: JSON.stringify({
          productIdToReturn: Number(input.productIdToReturn),
          quantityReturned: input.quantityReturned,
          replacementProductId: Number(input.replacementProductId),
          replacementQuantity: input.replacementQuantity,
          reason: input.reason,
        }),
      });
    } catch {
      // fallback
    }

    // 1. Return old item to stock
    await productsService.addStock(
      {
        productId: input.productIdToReturn,
        quantityAdded: input.quantityReturned,
        reason: `Exchange Return for Invoice #${input.originalInvoiceId}`,
      },
      employeeName
    );

    // 2. Issue NEW SEPARATE Invoice for replacement product
    const replacementProd = await productsService.getProductById(input.replacementProductId);
    const newInvoice = await invoicesService.createInvoice(
      {
        customerName: 'Exchange Customer',
        discountPercentage: 0,
        items: [
          {
            productId: input.replacementProductId,
            quantity: input.replacementQuantity,
          },
        ],
      },
      [
        {
          name: replacementProd?.name || 'Replacement Product',
          unit: replacementProd?.unit || 'piece',
        },
      ],
      employeeName
    );

    // 3. Mark original invoice
    const originalInvoice = await invoicesService.getInvoiceById(input.originalInvoiceId);
    if (originalInvoice) {
      originalInvoice.hasReturn = true;
    }

    const oldProd = await productsService.getProductById(input.productIdToReturn);

    const record: ReturnRecord = {
      id: `ret-${Date.now()}`,
      originalInvoiceId: input.originalInvoiceId,
      originalInvoiceNumber: originalInvoice?.invoiceNumber || `INV-${input.originalInvoiceId}`,
      type: 'Exchange',
      productId: input.productIdToReturn,
      productName: oldProd?.name || 'Returned Product',
      quantityReturned: input.quantityReturned,
      newInvoiceId: newInvoice.id,
      newInvoiceNumber: newInvoice.invoiceNumber,
      employeeId: 'emp-1',
      employeeName,
      reason: input.reason || 'Customer Item Exchange',
      createdAt: new Date().toISOString(),
    };

    mockReturns.unshift(record);
    return record;
  },
};
