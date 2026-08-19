import { apiClient } from '../client';
import type {
  DebtCustomer,
  DebtInvoice,
  DebtPayment,
  SettleDebtInput,
  CreateCustomerInput,
} from '../../types';

export const debtService = {
  async getCustomers(): Promise<DebtCustomer[]> {
    try {
      let data: any[] | null = null;
      const endpoints = ['/api/customers', '/api/Customers', '/api/debts/customers', '/api/customer'];
      for (const ep of endpoints) {
        try {
          data = await apiClient<any[]>(ep);
          if (Array.isArray(data)) break;
        } catch {
          // try next
        }
      }

      if (Array.isArray(data)) {
        return data.map((c) => ({
          id: String(c.id || c.customerId),
          nickname: c.nickname || c.fullName || c.name || 'Customer',
          phone: c.phone || c.phoneNumber || '',
          totalOutstanding: c.totalOutstanding ?? c.totalDebt ?? c.balance ?? 0,
          lastTransactionDate: c.lastTransactionDate || c.lastActivityDate || c.updatedAt || null,
        }));
      }
    } catch (err) {
      console.error('Error fetching customers from API:', err);
    }
    return [];
  },

  async getCustomerById(id: string): Promise<DebtCustomer | undefined> {
    try {
      let c: any = null;
      const endpoints = [
        `/api/customers/${id}`,
        `/api/Customers/${id}`,
        `/api/debts/customers/${id}`,
        `/api/customer/${id}`,
      ];
      for (const ep of endpoints) {
        try {
          c = await apiClient<any>(ep);
          if (c && (c.id || c.customerId)) break;
        } catch {
          // try next
        }
      }

      if (c && (c.id || c.customerId)) {
        return {
          id: String(c.id || c.customerId),
          nickname: c.nickname || c.fullName || c.name || 'Customer',
          phone: c.phone || c.phoneNumber || '',
          totalOutstanding: c.totalOutstanding ?? c.totalDebt ?? c.balance ?? 0,
          lastTransactionDate: c.lastTransactionDate || c.lastActivityDate || c.updatedAt || null,
        };
      }
    } catch (err) {
      console.error('Error fetching customer by ID:', err);
    }
    return undefined;
  },

  async createCustomer(input: CreateCustomerInput): Promise<DebtCustomer> {
    const payload = {
      fullName: input.nickname,
      name: input.nickname,
      nickname: input.nickname,
      phone: input.phone || '',
      phoneNumber: input.phone || '',
    };

    const response = await apiClient<any>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const realId = response?.id || response?.customerId || response?.Id;
    const assignedNickname = response?.nickname || response?.fullName || response?.name || input.nickname;
    const assignedPhone = response?.phone || response?.phoneNumber || input.phone;

    return {
      id: String(realId || `cust-${Date.now()}`),
      nickname: assignedNickname,
      phone: assignedPhone,
      totalOutstanding: response?.totalOutstanding ?? response?.totalDebt ?? 0,
      lastTransactionDate: response?.lastTransactionDate || null,
    };
  },

  async getDebtInvoices(customerId: string): Promise<DebtInvoice[]> {
    try {
      let data: any[] | null = null;
      const endpoints = [
        `/api/customers/${customerId}/invoices`,
        `/api/Customers/${customerId}/invoices`,
        `/api/debts/customers/${customerId}/invoices`,
      ];
      for (const ep of endpoints) {
        try {
          data = await apiClient<any[]>(ep);
          if (Array.isArray(data)) break;
        } catch {
          // try next
        }
      }

      if (Array.isArray(data)) {
        return data.map((inv) => ({
          invoiceId: String(inv.invoiceId || inv.id),
          invoiceNumber: inv.invoiceNumber || `INV-${inv.invoiceId || inv.id}`,
          date: inv.date || inv.createdAt || '',
          originalAmount: inv.originalAmount ?? inv.totalAmount ?? 0,
          remainingBalance: inv.remainingBalance ?? 0,
          isPaid: Boolean(inv.isPaid),
        }));
      }
    } catch (err) {
      console.error('Error fetching customer debt invoices:', err);
    }
    return [];
  },

  async getDebtPayments(customerId: string): Promise<DebtPayment[]> {
    try {
      let data: any[] | null = null;
      const endpoints = [
        `/api/customers/${customerId}/payments`,
        `/api/Customers/${customerId}/payments`,
        `/api/debts/customers/${customerId}/payments`,
      ];
      for (const ep of endpoints) {
        try {
          data = await apiClient<any[]>(ep);
          if (Array.isArray(data)) break;
        } catch {
          // try next
        }
      }

      if (Array.isArray(data)) {
        return data.map((p) => ({
          id: String(p.id),
          customerId: String(p.customerId || customerId),
          amount: p.amount ?? 0,
          date: p.date || p.createdAt || '',
          note: p.note,
        }));
      }
    } catch (err) {
      console.error('Error fetching customer debt payments:', err);
    }
    return [];
  },

  async settleDebt(input: SettleDebtInput): Promise<{ success: boolean; newOutstanding: number }> {
    let response: any = null;
    const endpoints = [
      `/api/customers/${input.customerId}/payments`,
      `/api/Customers/${input.customerId}/payments`,
      `/api/debts/customers/${input.customerId}/payments`,
    ];
    for (const ep of endpoints) {
      try {
        response = await apiClient<any>(ep, {
          method: 'POST',
          body: JSON.stringify({ amount: input.amount, note: input.note }),
        });
        if (response) break;
      } catch {
        // try next
      }
    }

    return {
      success: true,
      newOutstanding: response?.newOutstanding ?? response?.totalOutstanding ?? 0,
    };
  },

  addDebtToCustomer(_customerId: string, _invoiceId: string, _amount: number) {
    // Handled on backend upon creating debt invoice
  },
};
