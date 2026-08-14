export type ReturnType = 'PureReturn' | 'Exchange';

export interface ReturnRecord {
  id: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  type: ReturnType;
  productId: string;
  productName: string;
  quantityReturned: number;
  newInvoiceId?: string; // Set only for Exchange
  newInvoiceNumber?: string;
  employeeId: string;
  employeeName: string;
  reason?: string;
  createdAt: string;
}

export interface ExecutePureReturnInput {
  originalInvoiceId: string;
  productId: string;
  quantityReturned: number;
  reason?: string;
}

export interface ExecuteExchangeInput {
  originalInvoiceId: string;
  productIdToReturn: string;
  quantityReturned: number;
  replacementProductId: string;
  replacementQuantity: number;
  reason?: string;
}
