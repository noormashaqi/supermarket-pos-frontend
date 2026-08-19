import { apiClient } from '../client';
import type { Product, CreateProductInput, UpdateProductInput, AddStockInput, StockMovement, ProductUnit } from '../../types';

export const productsService = {
  async getProducts(categoryId?: string, activeOnly?: boolean): Promise<Product[]> {
    try {
      const endpoint = categoryId && categoryId !== 'all'
        ? `/api/Products?categoryId=${categoryId}`
        : '/api/Products';
      const data = await apiClient<any[]>(endpoint);
      if (Array.isArray(data)) {
        let prods: Product[] = data.map((p) => ({
          id: String(p.id),
          name: p.name || 'Unnamed Product',
          sellingPrice: p.sellingPrice ?? p.price ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.quantity ?? p.stockQuantity ?? 0,
          minStockLevel: p.minStockLevel ?? 10,
          unit: (p.unit && p.unit.toLowerCase() === 'package' ? 'package' : 'piece') as ProductUnit,
          categoryId: String(p.categoryId || ''),
          categoryName: p.categoryName || 'General',
          isActive: Boolean(p.isActive ?? p.IsActive ?? (p.isDeactivated !== undefined ? !p.isDeactivated : p.active ?? p.Active ?? true)),
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }));
        if (activeOnly) {
          prods = prods.filter((p) => p.isActive);
        }
        return prods;
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
    return [];
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const p = await apiClient<any>(`/api/Products/${id}`);
      if (p && p.id) {
        return {
          id: String(p.id),
          name: p.name || 'Unnamed Product',
          sellingPrice: p.sellingPrice ?? p.price ?? 0,
          costPrice: p.costPrice ?? 0,
          quantity: p.quantity ?? p.stockQuantity ?? 0,
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

  async createProduct(input: CreateProductInput, _employeeName?: string): Promise<Product> {
    const res = await apiClient<any>('/api/Products', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        sellingPrice: input.sellingPrice,
        costPrice: input.costPrice || 0,
        initialQuantity: input.initialQuantity || 0,
        minStockLevel: input.minStockLevel || 0,
        unit: input.unit || 'piece',
        categoryId: Number(input.categoryId) || input.categoryId,
      }),
    });

    const realId = res?.id || res?.productId;
    if (realId) {
      const fresh = await this.getProductById(String(realId));
      if (fresh) return fresh;
    }

    return {
      id: String(realId || Date.now()),
      name: input.name,
      sellingPrice: input.sellingPrice,
      costPrice: input.costPrice || 0,
      quantity: input.initialQuantity || 0,
      minStockLevel: input.minStockLevel || 0,
      unit: input.unit || 'piece',
      categoryId: input.categoryId,
      categoryName: 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateProduct(id: string, input: UpdateProductInput, _employeeName?: string): Promise<Product> {
    const res = await apiClient<any>(`/api/Products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: Number(id) || id,
        name: input.name,
        sellingPrice: input.sellingPrice,
        costPrice: input.costPrice || 0,
        minStockLevel: input.minStockLevel || 0,
        unit: input.unit || 'piece',
        categoryId: Number(input.categoryId) ? Number(input.categoryId) : input.categoryId,
      }),
    });

    const fresh = await this.getProductById(id);
    if (fresh) return fresh;

    return {
      id,
      name: input.name || 'Product',
      sellingPrice: input.sellingPrice || 0,
      costPrice: input.costPrice || 0,
      quantity: res?.quantity ?? 0,
      minStockLevel: input.minStockLevel || 0,
      unit: input.unit || 'piece',
      categoryId: input.categoryId || '1',
      categoryName: 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async deactivateProduct(id: string): Promise<boolean> {
    const endpointsToTry = [
      { url: `/api/Products/${id}/deactivate`, method: 'PUT' },
      { url: `/api/products/${id}/deactivate`, method: 'PUT' },
      { url: `/api/Products/${id}/deactivate`, method: 'PATCH' },
      { url: `/api/products/${id}/deactivate`, method: 'PATCH' },
      { url: `/api/Products/${id}`, method: 'DELETE' },
      { url: `/api/products/${id}`, method: 'DELETE' },
    ];

    for (const ep of endpointsToTry) {
      try {
        await apiClient<any>(ep.url, { method: ep.method });
        return true;
      } catch {
        // try next
      }
    }
    return false;
  },

  async addStock(input: AddStockInput, employeeName: string = 'Inventory Manager'): Promise<Product> {
    let res: any = null;
    try {
      res = await apiClient<any>(`/api/Products/${input.productId}/add-stock`, {
        method: 'POST',
        body: JSON.stringify({
          quantityAdded: input.quantityAdded,
          reason: input.reason || 'Restock',
          employeeName,
        }),
      });
    } catch {
      res = await apiClient<any>(`/api/Products/${input.productId}/stock`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: input.quantityAdded,
          notes: input.reason || 'Restock',
          employeeName,
        }),
      });
    }

    const fresh = await this.getProductById(input.productId);
    if (fresh) return fresh;

    return {
      id: input.productId,
      name: res?.name || 'Updated Product',
      sellingPrice: res?.sellingPrice || 0,
      costPrice: res?.costPrice || 0,
      quantity: res?.quantity ?? input.quantityAdded,
      minStockLevel: res?.minStockLevel || 10,
      unit: 'piece',
      categoryId: '1',
      categoryName: 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async getStockHistory(productId?: string): Promise<StockMovement[]> {
    try {
      let data: any[] | null = null;
      const endpointsToTry = productId && productId !== 'all'
        ? [
            `/api/Products/${productId}/stock/history`,
            `/api/Products/${productId}/stock-history`,
            `/api/products/${productId}/stock-logs`,
            `/api/stock-logs?productId=${productId}`,
            `/api/products/stock-history?productId=${productId}`,
          ]
        : [
            '/api/products/stock-history',
            '/api/Products/stock/history',
            '/api/stock-logs',
            '/api/Products/stock-logs',
            '/api/Products/stock-history',
          ];

      for (const endpoint of endpointsToTry) {
        try {
          data = await apiClient<any[]>(endpoint);
          if (Array.isArray(data)) break;
        } catch {
          // try next endpoint
        }
      }

      if (Array.isArray(data)) {
        return data.map((m, index) => {
          const rawId = m.id ?? m.Id ?? m.stockLogId ?? m.StockLogId ?? m.logId ?? index;
          const rawProdId = m.productId ?? m.ProductId ?? m.product?.id ?? productId ?? '';
          const rawProdName = m.productName ?? m.ProductName ?? m.product?.name ?? 'Product';
          const rawQty = m.quantityAdded ?? m.QuantityAdded ?? m.quantity ?? m.Quantity ?? 0;
          const rawEmpId = m.employeeId ?? m.EmployeeId ?? m.employee?.id ?? '1';
          const rawEmpName = m.employeeName ?? m.EmployeeName ?? m.employee?.fullName ?? m.employee?.username ?? 'Inventory Manager';
          const rawReason = m.reason ?? m.Reason ?? m.notes ?? m.Notes ?? 'Restock';
          const rawDate = m.createdAt ?? m.CreatedAt ?? m.date ?? m.Date ?? m.timestamp ?? m.Timestamp ?? new Date().toISOString();

          return {
            id: String(rawId),
            productId: String(rawProdId),
            productName: String(rawProdName),
            quantityAdded: Number(rawQty),
            employeeId: String(rawEmpId),
            employeeName: String(rawEmpName),
            reason: String(rawReason),
            createdAt: String(rawDate),
          };
        });
      }
    } catch (err) {
      console.error('Error fetching stock history:', err);
    }
    return [];
  },
};
