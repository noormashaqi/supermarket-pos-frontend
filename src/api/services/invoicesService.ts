import { apiClient } from '../client';
import type { Invoice, CreateInvoiceInput } from '../../types';

const toTrimmedString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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
          id: String(inv.id || inv.invoiceId),
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id || inv.invoiceId}`,
          employeeId: String(inv.employeeId || '1'),
          employeeName: inv.employeeName || 'Staff',
          customerName: inv.customerName || 'Walk-in Customer',
          items: Array.isArray(inv.items)
            ? inv.items.map((item: any) => ({
                productId: String(item.productId),
                productNameSnapshot: item.productNameSnapshot || item.productName || 'Product',
                unitPriceSnapshot: item.unitPriceSnapshot || item.unitPrice || 0,
                unit: (item.unit && item.unit.toLowerCase() === 'package') ? 'package' : 'piece',
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
      if (inv && (inv.id || inv.invoiceId)) {
        return {
          id: String(inv.id || inv.invoiceId),
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id || inv.invoiceId}`,
          employeeId: String(inv.employeeId || '1'),
          employeeName: inv.employeeName || 'Staff',
          customerName: inv.customerName || 'Walk-in Customer',
          items: Array.isArray(inv.items)
            ? inv.items.map((item: any) => ({
                productId: String(item.productId),
                productNameSnapshot: item.productNameSnapshot || item.productName || 'Product',
                unitPriceSnapshot: item.unitPriceSnapshot || item.unitPrice || 0,
                unit: (item.unit && item.unit.toLowerCase() === 'package') ? 'package' : 'piece',
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

    const realId = response?.invoiceId || response?.id;
    if (realId) {
      const realInvoice = await this.getInvoiceById(String(realId));
      if (realInvoice) {
        return realInvoice;
      }
    }

    return {
      id: String(realId || Date.now()),
      invoiceNumber: response?.invoiceNumber || `INV-${Date.now()}`,
      employeeId: '1',
      employeeName,
      customerName: input.customerName || 'Walk-in Customer',
      items: [],
      totalBeforeDiscount: response?.totalBeforeDiscount || 0,
      discountPercentage: input.discountPercentage || 0,
      totalAfterDiscount: response?.totalAfterDiscount || 0,
      hasReturn: false,
      isFullyReturned: false,
      createdAt: new Date().toISOString(),
    };
  },

  async getPrintableInvoice(id: string) {
    try {
      const data = await apiClient<any>(`/api/Invoices/${id}/printable`);
      if (data) {
        const invoiceId = toFiniteNumber(data.invoiceId ?? data.id);
        const invoiceNumber = toTrimmedString(data.invoiceNumber);
        const employeeName = toTrimmedString(data.employeeName);
        const date = toTrimmedString(data.date);
        const paymentMethod = toTrimmedString(data.paymentMethod);
        const totalBeforeDiscount = toFiniteNumber(data.totalBeforeDiscount);
        const discountPercentage = toFiniteNumber(data.discountPercentage);
        const discountAmount = toFiniteNumber(data.discountAmount);
        const totalAfterDiscount = toFiniteNumber(data.totalAfterDiscount);
        const items = Array.isArray(data.items)
          ? data.items
              .map((i: any) => {
                const productId = toFiniteNumber(i.productId);
                const productName = toTrimmedString(i.productName || i.productNameSnapshot);
                const unitPrice = toFiniteNumber(i.unitPrice ?? i.unitPriceSnapshot);
                const quantity = toFiniteNumber(i.quantity);
                const lineTotal = toFiniteNumber(i.lineTotal);

                if (
                  productId === null ||
                  !productName ||
                  unitPrice === null ||
                  quantity === null ||
                  lineTotal === null
                ) {
                  return null;
                }

                return {
                  productId,
                  productName,
                  unitPrice,
                  quantity,
                  lineTotal,
                };
              })
              .filter(
                (
                  item: {
                    productId: number;
                    productName: string;
                    unitPrice: number;
                    quantity: number;
                    lineTotal: number;
                  } | null
                ): item is {
                  productId: number;
                  productName: string;
                  unitPrice: number;
                  quantity: number;
                  lineTotal: number;
                } => item !== null
              )
          : [];
        const htmlReceipt = typeof data.htmlReceipt === 'string' ? data.htmlReceipt : '';

        if (
          invoiceId === null ||
          !invoiceNumber ||
          !employeeName ||
          !date ||
          !paymentMethod ||
          totalBeforeDiscount === null ||
          discountPercentage === null ||
          discountAmount === null ||
          totalAfterDiscount === null ||
          items.length === 0
        ) {
          console.error('Printable invoice response is incomplete:', data);
          return null;
        }

        return {
          invoiceId,
          invoiceNumber,
          employeeName,
          date,
          paymentMethod,
          totalBeforeDiscount,
          discountPercentage,
          discountAmount,
          totalAfterDiscount,
          hasReturn: Boolean(data.hasReturn),
          items,
          htmlReceipt,
        };
      }
    } catch (err) {
      console.error('Error fetching printable invoice:', err);
    }
    return null;
  },
};

