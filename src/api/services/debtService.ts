import { apiClient } from '../client';
import type {
  DebtCustomer,
  DebtInvoice,
  DebtPayment,
  SettleDebtInput,
  CreateCustomerInput,
} from '../../types';

// ── Mock Data ──────────────────────────────────────────────────────
let mockCustomers: DebtCustomer[] = [
  {
    id: 'dc-1',
    nickname: 'أبو خالد (Abu Khaled)',
    phone: '0791234567',
    totalOutstanding: 47.50,
    lastTransactionDate: '2026-08-17T14:30:00Z',
  },
  {
    id: 'dc-2',
    nickname: 'أم سارة (Um Sara)',
    phone: '0797654321',
    totalOutstanding: 23.80,
    lastTransactionDate: '2026-08-15T09:20:00Z',
  },
  {
    id: 'dc-3',
    nickname: 'الجار طارق (Neighbor Tariq)',
    phone: '0781112233',
    totalOutstanding: 112.00,
    lastTransactionDate: '2026-08-18T18:00:00Z',
  },
  {
    id: 'dc-4',
    nickname: 'عمّي أحمد (Uncle Ahmad)',
    phone: undefined,
    totalOutstanding: 8.20,
    lastTransactionDate: '2026-08-10T11:45:00Z',
  },
  {
    id: 'dc-5',
    nickname: 'مريم المكتب (Maryam Office)',
    phone: '0799887766',
    totalOutstanding: 0,
    lastTransactionDate: '2026-08-05T16:00:00Z',
  },
];

let mockDebtInvoices: DebtInvoice[] = [
  {
    invoiceId: '2001',
    invoiceNumber: 'INV-2026-002001',
    date: '2026-08-17T14:30:00Z',
    originalAmount: 25.00,
    remainingBalance: 25.00,
    isPaid: false,
  },
  {
    invoiceId: '2002',
    invoiceNumber: 'INV-2026-002002',
    date: '2026-08-16T10:00:00Z',
    originalAmount: 22.50,
    remainingBalance: 22.50,
    isPaid: false,
  },
  {
    invoiceId: '2003',
    invoiceNumber: 'INV-2026-002003',
    date: '2026-08-15T09:20:00Z',
    originalAmount: 23.80,
    remainingBalance: 23.80,
    isPaid: false,
  },
  {
    invoiceId: '2004',
    invoiceNumber: 'INV-2026-002004',
    date: '2026-08-18T18:00:00Z',
    originalAmount: 75.00,
    remainingBalance: 75.00,
    isPaid: false,
  },
  {
    invoiceId: '2005',
    invoiceNumber: 'INV-2026-002005',
    date: '2026-08-14T12:30:00Z',
    originalAmount: 37.00,
    remainingBalance: 37.00,
    isPaid: false,
  },
  {
    invoiceId: '2006',
    invoiceNumber: 'INV-2026-002006',
    date: '2026-08-10T11:45:00Z',
    originalAmount: 15.00,
    remainingBalance: 8.20,
    isPaid: false,
  },
];

// Map invoiceId → customerId for mock lookup
const invoiceCustomerMap: Record<string, string> = {
  '2001': 'dc-1',
  '2002': 'dc-1',
  '2003': 'dc-2',
  '2004': 'dc-3',
  '2005': 'dc-3',
  '2006': 'dc-4',
};

let mockPayments: DebtPayment[] = [
  {
    id: 'dp-1',
    customerId: 'dc-4',
    amount: 6.80,
    date: '2026-08-12T10:00:00Z',
    note: 'Partial payment',
  },
  {
    id: 'dp-2',
    customerId: 'dc-5',
    amount: 45.00,
    date: '2026-08-05T16:00:00Z',
    note: 'Full settlement',
  },
];

// ── Service ────────────────────────────────────────────────────────
export const debtService = {
  async getCustomers(): Promise<DebtCustomer[]> {
    try {
      const data = await apiClient<any[]>('/api/debts/customers');
      if (Array.isArray(data)) {
        return data.map((c) => ({
          id: String(c.id),
          nickname: c.nickname || c.name || 'Customer',
          phone: c.phone,
          totalOutstanding: c.totalOutstanding ?? 0,
          lastTransactionDate: c.lastTransactionDate || null,
        }));
      }
    } catch {
      // fallback
    }
    return [...mockCustomers];
  },

  async getCustomerById(id: string): Promise<DebtCustomer | undefined> {
    try {
      const c = await apiClient<any>(`/api/debts/customers/${id}`);
      if (c && c.id) {
        return {
          id: String(c.id),
          nickname: c.nickname || c.name || 'Customer',
          phone: c.phone,
          totalOutstanding: c.totalOutstanding ?? 0,
          lastTransactionDate: c.lastTransactionDate || null,
        };
      }
    } catch {
      // fallback
    }
    return mockCustomers.find((c) => c.id === id);
  },

  async createCustomer(input: CreateCustomerInput): Promise<DebtCustomer> {
    try {
      const response = await apiClient<any>('/api/debts/customers', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (response && response.id) {
        return {
          id: String(response.id),
          nickname: response.nickname || input.nickname,
          phone: response.phone || input.phone,
          totalOutstanding: 0,
          lastTransactionDate: null,
        };
      }
    } catch {
      // fallback
    }

    const newCustomer: DebtCustomer = {
      id: `dc-${Date.now()}`,
      nickname: input.nickname,
      phone: input.phone,
      totalOutstanding: 0,
      lastTransactionDate: null,
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },

  async getDebtInvoices(customerId: string): Promise<DebtInvoice[]> {
    try {
      const data = await apiClient<any[]>(`/api/debts/customers/${customerId}/invoices`);
      if (Array.isArray(data)) {
        return data.map((inv) => ({
          invoiceId: String(inv.invoiceId || inv.id),
          invoiceNumber: inv.invoiceNumber || '',
          date: inv.date || inv.createdAt || '',
          originalAmount: inv.originalAmount ?? inv.totalAmount ?? 0,
          remainingBalance: inv.remainingBalance ?? 0,
          isPaid: Boolean(inv.isPaid),
        }));
      }
    } catch {
      // fallback
    }
    return mockDebtInvoices.filter((inv) => invoiceCustomerMap[inv.invoiceId] === customerId);
  },

  async getDebtPayments(customerId: string): Promise<DebtPayment[]> {
    try {
      const data = await apiClient<any[]>(`/api/debts/customers/${customerId}/payments`);
      if (Array.isArray(data)) {
        return data.map((p) => ({
          id: String(p.id),
          customerId: String(p.customerId),
          amount: p.amount ?? 0,
          date: p.date || p.createdAt || '',
          note: p.note,
        }));
      }
    } catch {
      // fallback
    }
    return mockPayments.filter((p) => p.customerId === customerId);
  },

  async settleDebt(input: SettleDebtInput): Promise<{ success: boolean; newOutstanding: number }> {
    try {
      const response = await apiClient<any>(`/api/debts/customers/${input.customerId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: input.amount, note: input.note }),
      });
      if (response) {
        return {
          success: true,
          newOutstanding: response.newOutstanding ?? 0,
        };
      }
    } catch {
      // fallback
    }

    // Mock: distribute payment across unpaid invoices (oldest first)
    const customerInvoices = mockDebtInvoices
      .filter((inv) => invoiceCustomerMap[inv.invoiceId] === input.customerId && !inv.isPaid)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remaining = input.amount;
    for (const inv of customerInvoices) {
      if (remaining <= 0) break;
      if (remaining >= inv.remainingBalance) {
        remaining -= inv.remainingBalance;
        inv.remainingBalance = 0;
        inv.isPaid = true;
      } else {
        inv.remainingBalance = Number((inv.remainingBalance - remaining).toFixed(2));
        remaining = 0;
      }
    }

    // Update customer outstanding
    const customer = mockCustomers.find((c) => c.id === input.customerId);
    if (customer) {
      customer.totalOutstanding = Number(
        Math.max(0, customer.totalOutstanding - input.amount).toFixed(2)
      );
    }

    // Record the payment
    mockPayments.push({
      id: `dp-${Date.now()}`,
      customerId: input.customerId,
      amount: input.amount,
      date: new Date().toISOString(),
      note: input.note,
    });

    return {
      success: true,
      newOutstanding: customer?.totalOutstanding ?? 0,
    };
  },

  /** Called by invoicesService when a debt sale is created */
  addDebtToCustomer(customerId: string, invoiceId: string, amount: number) {
    const customer = mockCustomers.find((c) => c.id === customerId);
    if (customer) {
      customer.totalOutstanding = Number((customer.totalOutstanding + amount).toFixed(2));
      customer.lastTransactionDate = new Date().toISOString();
    }

    // Create a debt invoice entry
    mockDebtInvoices.push({
      invoiceId,
      invoiceNumber: `INV-2026-${invoiceId}`,
      date: new Date().toISOString(),
      originalAmount: amount,
      remainingBalance: amount,
      isPaid: false,
    });
    invoiceCustomerMap[invoiceId] = customerId;
  },
};
