export type ReturnType = 'PureReturn' | 'Exchange';

export interface ReturnRecord {
  id: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  type: ReturnType;
  productId: string;
  productName: string;
  quantityReturned: number;
  newInvoiceId?: string;
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

export interface ExchangeItemInput {
  productId: string | number;
  quantity: number;
}

export interface ExecuteExchangeInput {
  originalInvoiceId: string;
  // دعم كلا الحقلين للبديل القديم أو الجديد
  productIdToReturn?: string | number;
  oldProductId?: string | number;
  productId?: string | number;
  quantityReturned: number;
  // دعم التبديل بصنف واحد أو أصناف متعددة
  replacementProductId?: string | number;
  replacementQuantity?: number;
  newItems?: ExchangeItemInput[];
  reason?: string;
}