import { apiClient } from '../client';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  AddStockInput,
  StockMovement,
} from '../../types';

let mockProducts: Product[] = [
  {
    id: '1',
    name: 'Fresh Whole Milk 1L',
    costPrice: 1.80,
    sellingPrice: 2.50,
    quantity: 45,
    minStockLevel: 10,
    unit: 'piece',
    categoryId: '1',
    categoryName: 'Dairy & Eggs',
    isActive: true,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-08-10T12:00:00Z',
  },
  {
    id: '2',
    name: 'Organic Cavendish Bananas (1kg)',
    costPrice: 1.20,
    sellingPrice: 1.95,
    quantity: 4,
    minStockLevel: 15,
    unit: 'piece',
    categoryId: '2',
    categoryName: 'Produce & Fruits',
    isActive: true,
    createdAt: '2026-02-01T08:30:00Z',
    updatedAt: '2026-08-11T09:00:00Z',
  },
  {
    id: '3',
    name: 'Sliced Whole Wheat Toast Bread',
    costPrice: 2.10,
    sellingPrice: 3.20,
    quantity: 2,
    minStockLevel: 8,
    unit: 'package',
    categoryId: '3',
    categoryName: 'Bakery & Snacks',
    isActive: true,
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-08-11T14:20:00Z',
  },
  {
    id: '4',
    name: 'Mineral Water Bottled Pack (12x500ml)',
    costPrice: 3.00,
    sellingPrice: 4.50,
    quantity: 25,
    minStockLevel: 5,
    unit: 'package',
    categoryId: '4',
    categoryName: 'Beverages & Drinks',
    isActive: true,
    createdAt: '2026-02-10T11:15:00Z',
    updatedAt: '2026-08-08T16:00:00Z',
  },
];

let mockStockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    productId: '1',
    productName: 'Fresh Whole Milk 1L',
    quantityAdded: 50,
    employeeId: 'emp-1',
    employeeName: 'Ahmad Al-Mansoor',
    reason: 'Initial Inventory Load',
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'mov-2',
    productId: '2',
    productName: 'Organic Cavendish Bananas (1kg)',
    quantityAdded: 20,
    employeeId: 'emp-1',
    employeeName: 'Ahmad Al-Mansoor',
    reason: 'Supplier Shipment #PO-4421',
    createdAt: '2026-08-01T09:00:00Z',
  },
];

export const productsService = {
  async getProducts(categoryId?: string, activeOnly: boolean = true): Promise<Product[]> {
    try {
      let endpoint = `/api/products?activeOnly=${activeOnly}`;
      if (categoryId && categoryId !== 'all') {
        endpoint += `&categoryId=${categoryId}`;
      }
      const data = await apiClient<any[]>(endpoint);
      if (Array.isArray(data)) {
        return data.map((p) => ({
          id: String(p.id),
          name: p.name || 'Product',
          sellingPrice: p.price ?? p.sellingPrice ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.stockQuantity ?? p.quantity ?? 0,
          minStockLevel: p.minStockLevel ?? 10,
          unit: p.unit === 'package' ? 'package' : 'piece',
          categoryId: String(p.categoryId || '1'),
          categoryName: p.categoryName || 'General',
          isActive: p.isActive ?? !p.isDeactivated,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }));
      }
    } catch {
      // fallback
    }
    return [...mockProducts];
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const p = await apiClient<any>(`/api/products/${id}`);
      if (p && p.id) {
        return {
          id: String(p.id),
          name: p.name,
          sellingPrice: p.price ?? p.sellingPrice ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.stockQuantity ?? p.quantity ?? 0,
          minStockLevel: p.minStockLevel ?? 10,
          unit: p.unit === 'package' ? 'package' : 'piece',
          categoryId: String(p.categoryId || '1'),
          categoryName: p.categoryName || 'General',
          isActive: p.isActive ?? !p.isDeactivated,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        };
      }
    } catch {
      // fallback
    }
    return mockProducts.find((p) => p.id === id);
  },

  async getLowStock(): Promise<Product[]> {
    try {
      const data = await apiClient<any[]>('/api/products/low-stock');
      if (Array.isArray(data)) {
        return data.map((p) => ({
          id: String(p.id),
          name: p.name || 'Product',
          sellingPrice: p.price ?? p.sellingPrice ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.stockQuantity ?? p.quantity ?? 0,
          minStockLevel: p.minStockLevel ?? 10,
          unit: p.unit === 'package' ? 'package' : 'piece',
          categoryId: String(p.categoryId || '1'),
          categoryName: p.categoryName || 'General',
          isActive: true,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }));
      }
    } catch {
      // fallback
    }
    return mockProducts.filter((p) => p.quantity <= p.minStockLevel);
  },

  async createProduct(input: CreateProductInput, categoryName: string): Promise<Product> {
    try {
      const response = await apiClient<any>('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          price: input.sellingPrice,
          costPrice: input.costPrice || 0,
          stockQuantity: input.initialQuantity,
          minStockLevel: input.minStockLevel,
          unit: input.unit,
          categoryId: Number(input.categoryId) || 1,
        }),
      });
      if (response && response.id) {
        return {
          id: String(response.id),
          name: response.name || input.name,
          sellingPrice: input.sellingPrice,
          costPrice: input.costPrice,
          quantity: input.initialQuantity,
          minStockLevel: input.minStockLevel,
          unit: input.unit,
          categoryId: input.categoryId,
          categoryName,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {
      // fallback
    }

    const newProduct: Product = {
      id: String(Date.now()),
      name: input.name,
      sellingPrice: input.sellingPrice,
      costPrice: input.costPrice,
      quantity: input.initialQuantity,
      minStockLevel: input.minStockLevel,
      unit: input.unit,
      categoryId: input.categoryId,
      categoryName,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProducts.unshift(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, input: UpdateProductInput, categoryName?: string): Promise<Product> {
    try {
      await apiClient(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          price: input.sellingPrice,
          costPrice: input.costPrice,
          minStockLevel: input.minStockLevel,
          unit: input.unit,
          categoryId: input.categoryId ? Number(input.categoryId) : 1,
        }),
      });
    } catch {
      // fallback
    }

    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      mockProducts[idx] = {
        ...mockProducts[idx],
        ...input,
        sellingPrice: input.sellingPrice ?? mockProducts[idx].sellingPrice,
        categoryName: categoryName || mockProducts[idx].categoryName,
        updatedAt: new Date().toISOString(),
      };
      return mockProducts[idx];
    }
    throw new Error('Product not found');
  },

  async deactivateProduct(id: string): Promise<Product> {
    try {
      await apiClient(`/api/products/${id}/deactivate`, { method: 'PATCH' });
    } catch {
      // fallback
    }

    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      mockProducts[idx].isActive = false;
      return mockProducts[idx];
    }
    throw new Error('Product not found');
  },

  async addStock(input: AddStockInput, employeeName: string = 'Active Employee'): Promise<Product> {
    try {
      await apiClient(`/api/products/${input.productId}/stock/add`, {
        method: 'POST',
        body: JSON.stringify({
          productId: Number(input.productId),
          quantityAdded: input.quantityAdded,
          notes: input.reason,
        }),
      });
    } catch {
      // fallback
    }

    const idx = mockProducts.findIndex((p) => p.id === input.productId);
    if (idx !== -1) {
      const p = mockProducts[idx];
      p.quantity += input.quantityAdded;
      p.updatedAt = new Date().toISOString();

      mockStockMovements.unshift({
        id: `mov-${Date.now()}`,
        productId: p.id,
        productName: p.name,
        quantityAdded: input.quantityAdded,
        employeeId: 'emp-1',
        employeeName,
        reason: input.reason || 'Manual Stock Add Button',
        createdAt: new Date().toISOString(),
      });

      return p;
    }
    throw new Error('Product not found');
  },

  async getStockHistory(productId?: string): Promise<StockMovement[]> {
    if (productId) {
      return mockStockMovements.filter((m) => m.productId === productId);
    }
    return [...mockStockMovements];
  },
};
