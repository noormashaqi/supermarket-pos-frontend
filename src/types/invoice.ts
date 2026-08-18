export interface InvoiceItem {
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  unit: 'piece' | 'package';
  quantity: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Unique sequential number (e.g. INV-2026-001001)
  employeeId: string;
  employeeName: string;
  customerName?: string;
  items: InvoiceItem[];
  totalBeforeDiscount: number;
  discountPercentage: number; // Percentage discount on invoice level only (%)
  totalAfterDiscount: number;
  hasReturn: boolean;
  isFullyReturned: boolean;
  createdAt: string;
}

export interface CreateInvoiceInput {
  customerName?: string;
  discountPercentage?: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
  }>;
}
