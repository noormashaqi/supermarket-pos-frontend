import { apiClient } from '../client';
import type { Invoice, CreateInvoiceInput } from '../../types';
import { productsService } from './productsService';
import { debtService } from './debtService';

let mockInvoices: Invoice[] = [
  {
    id: '1001',
    invoiceNumber: 'INV-2026-001001',
    employeeId: 'emp-1',
    employeeName: 'Ahmad Al-Mansoor',
    customerName: 'Walk-in Customer',
    items: [
      {
        productId: '1',
        productNameSnapshot: 'Fresh Whole Milk 1L',
        unitPriceSnapshot: 2.50,
        unit: 'piece',
        quantity: 2,
        lineTotal: 5.00,
      },
      {
        productId: '4',
        productNameSnapshot: 'Mineral Water Bottled Pack (12x500ml)',
        unitPriceSnapshot: 4.50,
        unit: 'package',
        quantity: 1,
        lineTotal: 4.50,
      },
    ],
    totalBeforeDiscount: 9.50,
    discountPercentage: 5,
    totalAfterDiscount: 9.03,
    hasReturn: false,
    isFullyReturned: false,
    createdAt: '2026-08-11T16:45:00Z',
    paymentMethod: 'cash',
  },
  {
    id: '1002',
    invoiceNumber: 'INV-2026-001002',
    employeeId: 'emp-2',
    employeeName: 'Sara Cashier',
    customerName: 'Tariq Al-Saleh',
    items: [
      {
        productId: '3',
        productNameSnapshot: 'Sliced Whole Wheat Toast Bread',
        unitPriceSnapshot: 3.20,
        unit: 'package',
        quantity: 1,
        lineTotal: 3.20,
      },
    ],
    totalBeforeDiscount: 3.20,
    discountPercentage: 0,
    totalAfterDiscount: 3.20,
    hasReturn: false,
    isFullyReturned: false,
    createdAt: '2026-08-11T17:10:00Z',
    paymentMethod: 'cash',
  },
];

export const invoicesService = {
  async getInvoices(): Promise<Invoice[]> {
    try {
      const data = await apiClient<any[]>('/api/invoices');
      if (Array.isArray(data)) {
        return data.map((inv) => ({
          id: String(inv.id),
          invoiceNumber: inv.invoiceNumber || `INV-2026-${inv.id}`,
          employeeId: String(inv.employeeId || 'emp-1'),
          employeeName: inv.employeeName || 'Cashier',
          customerName: inv.customerName || 'Walk-in Customer',
          items: Array.isArray(inv.items)
            ? inv.items.map((i: any) => ({
                productId: String(i.productId),
                productNameSnapshot: i.productNameSnapshot || i.productName || 'Product',
                unitPriceSnapshot: i.unitPriceSnapshot || i.unitPrice || 0,
                unit: i.unit || 'piece',
                quantity: i.quantity || 1,
                lineTotal: i.lineTotal || (i.unitPrice * i.quantity),
              }))
            : [],
          totalBeforeDiscount: inv.totalBeforeDiscount || inv.subtotal || 0,
          discountPercentage: inv.discountPercentage || 0,
          totalAfterDiscount: inv.totalAfterDiscount || inv.totalAmount || 0,
          hasReturn: Boolean(inv.hasReturn),
          isFullyReturned: Boolean(inv.isFullyReturned),
          createdAt: inv.createdAt || new Date().toISOString(),
          paymentMethod: inv.paymentMethod || 'cash',
          debtCustomerId: inv.debtCustomerId,
          debtCustomerNickname: inv.debtCustomerNickname,
          remainingDebtBalance: inv.remainingDebtBalance,
        }));
      }
    } catch {
      // fallback
    }
    return [...mockInvoices];
  },

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    try {
      const inv = await apiClient<any>(`/api/invoices/${id}`);
      if (inv && inv.id) {
        return {
          id: String(inv.id),
          invoiceNumber: inv.invoiceNumber || `INV-2026-${inv.id}`,
          employeeId: String(inv.employeeId || 'emp-1'),
          employeeName: inv.employeeName || 'Cashier',
          customerName: inv.customerName || 'Walk-in Customer',
          items: Array.isArray(inv.items)
            ? inv.items.map((i: any) => ({
                productId: String(i.productId),
                productNameSnapshot: i.productNameSnapshot || i.productName || 'Product',
                unitPriceSnapshot: i.unitPriceSnapshot || i.unitPrice || 0,
                unit: i.unit || 'piece',
                quantity: i.quantity || 1,
                lineTotal: i.lineTotal || (i.unitPrice * i.quantity),
              }))
            : [],
          totalBeforeDiscount: inv.totalBeforeDiscount || inv.subtotal || 0,
          discountPercentage: inv.discountPercentage || 0,
          totalAfterDiscount: inv.totalAfterDiscount || inv.totalAmount || 0,
          hasReturn: Boolean(inv.hasReturn),
          isFullyReturned: Boolean(inv.isFullyReturned),
          createdAt: inv.createdAt || new Date().toISOString(),
          paymentMethod: inv.paymentMethod || 'cash',
          debtCustomerId: inv.debtCustomerId,
          debtCustomerNickname: inv.debtCustomerNickname,
          remainingDebtBalance: inv.remainingDebtBalance,
        };
      }
    } catch {
      // fallback
    }
    return mockInvoices.find((i) => i.id === id || i.invoiceNumber === id);
  },

  async createInvoice(
    input: CreateInvoiceInput,
    itemsDetail: Array<{ name: string; unit: 'piece' | 'package' }>,
    employeeName: string = 'Active Cashier'
  ): Promise<Invoice> {
    const prods = await productsService.getProducts();

    const items = input.items.map((item, idx) => {
      const p = prods.find((x) => x.id === item.productId);
      const unitPrice = p?.sellingPrice || 1.00;
      return {
        productId: item.productId,
        productNameSnapshot: itemsDetail[idx]?.name || p?.name || 'Supermarket Item',
        unitPriceSnapshot: unitPrice,
        unit: itemsDetail[idx]?.unit || p?.unit || 'piece',
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const totalBeforeDiscount = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const discountPercentage = Math.min(100, Math.max(0, input.discountPercentage || 0));
    const discountValue = totalBeforeDiscount * (discountPercentage / 100);
    const totalAfterDiscount = Number((totalBeforeDiscount - discountValue).toFixed(2));

    try {
      const response = await apiClient<any>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customerName: input.customerName || 'Walk-in Customer',
          discountPercentage,
          items: input.items.map((i) => ({
            productId: Number(i.productId) || 1,
            quantity: i.quantity,
          })),
        }),
      });

      if (response && response.id) {
        return {
          id: String(response.id),
          invoiceNumber: response.invoiceNumber || `INV-2026-${response.id}`,
          employeeId: 'emp-1',
          employeeName,
          customerName: input.customerName || 'Walk-in Customer',
          items,
          totalBeforeDiscount,
          discountPercentage,
          totalAfterDiscount,
          hasReturn: false,
          isFullyReturned: false,
          createdAt: response.createdAt || new Date().toISOString(),
          paymentMethod: input.paymentMethod || 'cash',
          debtCustomerId: input.debtCustomerId,
          debtCustomerNickname: response.debtCustomerNickname,
          remainingDebtBalance: response.remainingDebtBalance,
        };
      }
    } catch {
      // fallback
    }

    // Auto deduct inventory stock upon invoice confirmation
    for (const item of input.items) {
      const p = prods.find((x) => x.id === item.productId);
      if (p) {
        p.quantity = Math.max(0, p.quantity - item.quantity);
      }
    }

    const paymentMethod = input.paymentMethod || 'cash';
    const invoiceId = String(Date.now());

    // If debt sale, update customer's outstanding balance
    let debtCustomerNickname: string | undefined;
    let remainingDebtBalance: number | undefined;
    if (paymentMethod === 'debt' && input.debtCustomerId) {
      debtService.addDebtToCustomer(input.debtCustomerId, invoiceId, totalAfterDiscount);
      const customer = await debtService.getCustomerById(input.debtCustomerId);
      debtCustomerNickname = customer?.nickname;
      remainingDebtBalance = customer?.totalOutstanding;
    }

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber: `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      employeeId: 'emp-1',
      employeeName,
      customerName: input.customerName || 'Walk-in Customer',
      items,
      totalBeforeDiscount,
      discountPercentage,
      totalAfterDiscount,
      hasReturn: false,
      isFullyReturned: false,
      createdAt: new Date().toISOString(),
      paymentMethod,
      debtCustomerId: input.debtCustomerId,
      debtCustomerNickname,
      remainingDebtBalance,
    };

    mockInvoices.unshift(newInvoice);
    return newInvoice;
  },
};
