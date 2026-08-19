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
      try {
        data = await apiClient<any[]>('/api/customers');
      } catch {
        data = await apiClient<any[]>('/api/debts/customers');
      }

      if (Array.isArray(data)) {
        return data.map((c) => ({
          id: String(c.id || c.customerId),
          nickname: c.nickname || c.name || c.fullName || 'Customer',
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
      try {
        c = await apiClient<any>(`/api/customers/${id}`);
      } catch {
        c = await apiClient<any>(`/api/debts/customers/${id}`);
      }

      if (c && (c.id || c.customerId)) {
        return {
          id: String(c.id || c.customerId),
          nickname: c.nickname || c.name || c.fullName || 'Customer',
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
    let response: any = null;
    try {
      response = await apiClient<any>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      response = await apiClient<any>('/api/debts/customers', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    }

    return {
      id: String(response?.id || response?.customerId || Date.now()),
      nickname: response?.nickname || response?.name || input.nickname,
      phone: response?.phone || input.phone,
      totalOutstanding: response?.totalOutstanding ?? 0,
      lastTransactionDate: response?.lastTransactionDate || null,
    };
  },

  async getDebtInvoices(customerId: string): Promise<DebtInvoice[]> {
    try {
      let data: any[] | null = null;
      try {
        data = await apiClient<any[]>(`/api/customers/${customerId}/invoices`);
      } catch {
        data = await apiClient<any[]>(`/api/debts/customers/${customerId}/invoices`);
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
      try {
        data = await apiClient<any[]>(`/api/customers/${customerId}/payments`);
      } catch {
        data = await apiClient<any[]>(`/api/debts/customers/${customerId}/payments`);
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
    try {
      response = await apiClient<any>(`/api/customers/${input.customerId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: input.amount, note: input.note }),
      });
    } catch {
      response = await apiClient<any>(`/api/debts/customers/${input.customerId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: input.amount, note: input.note }),
      });
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
