import { apiClient } from '../client';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  AddStockInput,
  StockMovement,
  ProductUnit,
} from '../../types';

export const productsService = {
  // 1. جلب قائمة المنتجات
  async getProducts(categoryId?: string, activeOnly: boolean = false): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (categoryId && categoryId !== 'all') {
        params.append('categoryId', categoryId);
      }
      if (activeOnly) {
        params.append('activeOnly', 'true');
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';
      const data = await apiClient<any[]>(endpoint);

      if (Array.isArray(data)) {
        return data.map((p) => ({
          id: String(p.id),
          name: p.name || 'Unnamed Product',
          sellingPrice: p.sellingPrice ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.quantity ?? 0,
          minStockLevel: p.minStockLevel ?? 10,
          unit: (p.unit && p.unit.toLowerCase() === 'package' ? 'package' : 'piece') as ProductUnit,
          categoryId: String(p.categoryId || ''),
          categoryName: p.categoryName || 'General',
          isActive: Boolean(p.isActive ?? true),
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
    return [];
  },

  // 2. جلب منتج حسب الرقم التعريفي ID
  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const p = await apiClient<any>(`/api/products/${id}`);
      if (p && p.id) {
        return {
          id: String(p.id),
          name: p.name || 'Unnamed Product',
          sellingPrice: p.sellingPrice ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.quantity ?? 0,
          minStockLevel: p.minStockLevel ?? 10,
          unit: (p.unit && p.unit.toLowerCase() === 'package' ? 'package' : 'piece') as ProductUnit,
          categoryId: String(p.categoryId || ''),
          categoryName: p.categoryName || 'General',
          isActive: Boolean(p.isActive ?? true),
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error('Error fetching product by ID:', err);
    }
    return undefined;
  },

  // 3. إنشاء منتج جديد
  async createProduct(input: CreateProductInput): Promise<Product> {
    const payload = {
      name: input.name,
      categoryId: Number(input.categoryId),
      sellingPrice: Number(input.sellingPrice),
      costPrice: Number(input.costPrice || 0),
      quantity: Number(input.initialQuantity || 0),
      minStockLevel: Number(input.minStockLevel || 0),
      unit: String(input.unit).toLowerCase().includes('package') ? 'Package' : 'Piece',
      employeeId: 1, // Required by backend validation
    };

    console.log('Creating Product Payload:', payload);

    const res = await apiClient<any>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const realId = res?.id;
    if (realId) {
      const fresh = await this.getProductById(String(realId));
      if (fresh) return fresh;
    }

    return {
      id: String(realId || Date.now()),
      name: input.name,
      sellingPrice: Number(input.sellingPrice),
      costPrice: Number(input.costPrice || 0),
      quantity: Number(input.initialQuantity || 0),
      minStockLevel: Number(input.minStockLevel || 0),
      unit: (input.unit || 'piece') as ProductUnit,
      categoryId: String(input.categoryId),
      categoryName: 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  // 4. تعديل بيانات المنتج
  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const payload = {
      id: Number(id),
      name: input.name,
      categoryId: Number(input.categoryId),
      sellingPrice: Number(input.sellingPrice),
      costPrice: Number(input.costPrice || 0),
      minStockLevel: Number(input.minStockLevel || 0),
      unit: String(input.unit).toLowerCase().includes('package') ? 'Package' : 'Piece',
    };

    await apiClient<any>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    const fresh = await this.getProductById(id);
    if (fresh) return fresh;

    return {
      id,
      name: input.name || 'Product',
      sellingPrice: Number(input.sellingPrice || 0),
      costPrice: Number(input.costPrice || 0),
      quantity: 0,
      minStockLevel: Number(input.minStockLevel || 0),
      unit: (input.unit || 'piece') as ProductUnit,
      categoryId: String(input.categoryId || '1'),
      categoryName: 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  // 5. تعطيل منتج
  async deactivateProduct(id: string): Promise<boolean> {
    try {
      await apiClient<any>(`/api/products/${id}/deactivate`, { method: 'PATCH' });
      return true;
    } catch (err) {
      console.error('Failed to deactivate product:', err);
      return false;
    }
  },

  // 6. تفعيل منتج
  async activateProduct(id: string): Promise<boolean> {
    try {
      await apiClient<any>(`/api/products/${id}/activate`, { method: 'PATCH' });
      return true;
    } catch (err) {
      console.error('Failed to activate product:', err);
      return false;
    }
  },

  // 7. إضافة كمية للمخزون
  async addStock(input: AddStockInput): Promise<Product> {
    const payload = {
      quantityAdded: Number(input.quantityAdded),
      reason: input.reason || 'Restock',
    };

    await apiClient<any>(`/api/products/${input.productId}/stock/add`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const fresh = await this.getProductById(input.productId);
    if (fresh) return fresh;

    return {
      id: input.productId,
      name: 'Updated Product',
      sellingPrice: 0,
      costPrice: 0,
      quantity: Number(input.quantityAdded),
      minStockLevel: 10,
      unit: 'piece',
      categoryId: '1',
      categoryName: 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  // 8. جلب سجل حركات المخزون
  async getStockHistory(productId?: string): Promise<StockMovement[]> {
    try {
      const endpoint = productId && productId !== 'all'
        ? `/api/products/${productId}/stock/history`
        : '/api/products/stock-history';

      const data = await apiClient<any[]>(endpoint);

      if (Array.isArray(data)) {
        return data.map((m, index) => ({
          id: String(m.id ?? index),
          productId: String(m.productId ?? productId ?? ''),
          productName: String(m.productName ?? 'Product'),
          quantityAdded: Number(m.quantityAdded ?? m.quantity ?? 0),
          employeeId: String(m.employeeId ?? '1'),
          employeeName: String(m.employeeName ?? 'Inventory Manager'),
          reason: String(m.reason ?? 'Restock'),
          createdAt: String(m.createdAt ?? new Date().toISOString()),
        }));
      }
    } catch (err) {
      console.error('Error fetching stock history:', err);
    }
    return [];
  },
};