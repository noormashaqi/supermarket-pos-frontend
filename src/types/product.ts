export type ProductUnit = 'piece' | 'package';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  sellingPrice: number;
  costPrice?: number;
  quantity: number;
  minStockLevel: number;
  unit: ProductUnit; // Piece (حبة) or Package (باكيج)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantityAdded: number;
  employeeId: string;
  employeeName: string;
  reason: string;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  sellingPrice: number;
  costPrice?: number;
  initialQuantity: number;
  minStockLevel: number;
  unit: ProductUnit;
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  sellingPrice?: number;
  costPrice?: number;
  minStockLevel?: number;
  unit?: ProductUnit;
}

export interface AddStockInput {
  productId: string;
  quantityAdded: number;
  reason: string;
}
