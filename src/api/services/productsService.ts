import { apiClient } from '../client';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  AddStockInput,
  StockMovement,
} from '../../types';

export const productsService = {
  async getProducts(categoryId?: string, activeOnly: boolean = true): Promise<Product[]> {
    try {
      let endpoint = `/api/Products?activeOnly=${activeOnly}`;
      if (categoryId && categoryId !== 'all') {
        endpoint += `&categoryId=${categoryId}`;
      }
      const data = await apiClient<any[]>(endpoint);
      if (Array.isArray(data)) {
        return data.map((p) => ({
          id: String(p.id),
          name: p.name || 'Product',
          sellingPrice: p.sellingPrice ?? p.price ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.quantity ?? p.stockQuantity ?? 0,
          minStockLevel: p.minStockLevel ?? 10,
          unit: (p.unit && p.unit.toLowerCase() === 'package') ? 'package' : 'piece',
          categoryId: String(p.categoryId || '1'),
          categoryName: p.categoryName || 'General',
          isActive: p.isActive !== undefined ? p.isActive : true,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Error fetching products from API:', err);
    }
    return [];
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const p = await apiClient<any>(`/api/Products/${id}`);
      if (p && p.id) {
        return {
          id: String(p.id),
          name: p.name,
          sellingPrice: p.sellingPrice ?? p.price ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.quantity ?? p.stockQuantity ?? 0,
          minStockLevel: p.minStockLevel ?? 10,
          unit: (p.unit && p.unit.toLowerCase() === 'package') ? 'package' : 'piece',
          categoryId: String(p.categoryId || '1'),
          categoryName: p.categoryName || 'General',
          isActive: p.isActive !== undefined ? p.isActive : true,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error('Error fetching product by ID:', err);
    }
    return undefined;
  },

  async createProduct(input: CreateProductInput, _employeeName: string = 'Admin'): Promise<Product> {
    const p = await apiClient<any>('/api/Products', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        categoryId: Number(input.categoryId) || 1,
        sellingPrice: input.sellingPrice,
        costPrice: input.costPrice || 0,
        minStockLevel: input.minStockLevel || 10,
        unit: input.unit === 'package' ? 'Package' : 'Piece',
      }),
    });

    return {
      id: String(p?.id || Date.now()),
      name: p?.name || input.name,
      sellingPrice: p?.sellingPrice ?? input.sellingPrice,
      costPrice: p?.costPrice ?? input.costPrice ?? 0,
      quantity: p?.quantity ?? 0,
      minStockLevel: p?.minStockLevel ?? input.minStockLevel ?? 10,
      unit: input.unit,
      categoryId: String(input.categoryId),
      categoryName: p?.categoryName || 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateProduct(id: string, input: UpdateProductInput, _employeeName: string = 'Admin'): Promise<Product> {
    const p = await apiClient<any>(`/api/Products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...input,
        categoryId: input.categoryId ? Number(input.categoryId) : undefined,
        unit: input.unit ? (input.unit === 'package' ? 'Package' : 'Piece') : undefined,
      }),
    });

    return {
      id: String(id),
      name: p?.name || input.name || '',
      sellingPrice: p?.sellingPrice ?? input.sellingPrice ?? 0,
      costPrice: p?.costPrice ?? input.costPrice ?? 0,
      quantity: p?.quantity ?? 0,
      minStockLevel: p?.minStockLevel ?? input.minStockLevel ?? 10,
      unit: input.unit || 'piece',
      categoryId: String(input.categoryId || '1'),
      categoryName: p?.categoryName || 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async deactivateProduct(id: string, _employeeName: string = 'Admin'): Promise<boolean> {
    await apiClient(`/api/Products/${id}/deactivate`, {
      method: 'PATCH',
    });
    return true;
  },

  async addStock(input: AddStockInput, employeeName: string = 'Current Employee'): Promise<Product> {
    const p = await apiClient<any>(`/api/Products/${input.productId}/stock/add`, {
      method: 'POST',
      body: JSON.stringify({
        quantityAdded: input.quantityAdded,
        reason: input.reason,
        employeeName,
      }),
    });

    return {
      id: String(input.productId),
      name: p?.name || 'Product',
      sellingPrice: p?.sellingPrice ?? 0,
      costPrice: p?.costPrice ?? 0,
      quantity: p?.quantity ?? 0,
      minStockLevel: p?.minStockLevel ?? 10,
      unit: (p?.unit && p.unit.toLowerCase() === 'package') ? 'package' : 'piece',
      categoryId: String(p?.categoryId || '1'),
      categoryName: p?.categoryName || 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async getStockHistory(productId?: string): Promise<StockMovement[]> {
    try {
      let endpoint = '/api/Products/stock/history';
      if (productId && productId !== 'all') {
        endpoint = `/api/Products/${productId}/stock/history`;
      }
      const data = await apiClient<any[]>(endpoint);
      if (Array.isArray(data)) {
        return data.map((m) => ({
          id: String(m.id),
          productId: String(m.productId),
          productName: m.productName || 'Product',
          quantityAdded: m.quantityAdded || 0,
          employeeId: String(m.employeeId || '1'),
          employeeName: m.employeeName || 'Staff',
          reason: m.reason || 'Restock',
          createdAt: m.createdAt || m.date || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Error fetching stock history:', err);
    }
    return [];
  },
};
