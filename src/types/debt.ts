export type PaymentMethod = 'cash' | 'debt';

export interface DebtCustomer {
  id: string;
  nickname: string;
  phone?: string;
  totalOutstanding: number;
  lastTransactionDate: string | null;
}

export interface DebtInvoice {
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  originalAmount: number;
  remainingBalance: number;
  isPaid: boolean;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface SettleDebtInput {
  customerId: string;
  amount: number;
  note?: string;
}

export interface CreateCustomerInput {
  nickname: string;
  phone?: string;
}
