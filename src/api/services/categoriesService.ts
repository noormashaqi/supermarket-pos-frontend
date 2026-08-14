import { apiClient } from '../client';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../types';

let mockCategories: Category[] = [
  { id: 'cat-1', name: 'Dairy & Eggs', code: 'DAIRY', description: 'Fresh milk, cheese, yogurt, and organic eggs', productsCount: 12, createdAt: '2026-01-10T10:00:00Z' },
  { id: 'cat-2', name: 'Produce & Fruits', code: 'PROD', description: 'Fresh fruits, vegetables, and leafy greens', productsCount: 24, createdAt: '2026-01-10T10:30:00Z' },
  { id: 'cat-3', name: 'Bakery & Snacks', code: 'BAKERY', description: 'Freshly baked bread, toast, and snacks', productsCount: 8, createdAt: '2026-01-12T11:00:00Z' },
  { id: 'cat-4', name: 'Beverages & Drinks', code: 'BEV', description: 'Juices, sodas, energy drinks, and bottled water', productsCount: 18, createdAt: '2026-01-15T09:00:00Z' },
  { id: 'cat-5', name: 'Frozen Foods', code: 'FROZEN', description: 'Frozen meat, ice cream, and quick meals', productsCount: 15, createdAt: '2026-01-20T14:00:00Z' },
];

export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    try {
      const data = await apiClient<any[]>('/api/categories');
      if (Array.isArray(data)) {
        return data.map((c) => ({
          id: String(c.id),
          name: c.name || c.categoryName || 'Category',
          code: c.code || `CAT-${c.id}`,
          description: c.description || '',
          productsCount: c.productsCount || 0,
          createdAt: c.createdAt || new Date().toISOString(),
        }));
      }
    } catch {
      // Fallback mock
    }
    return [...mockCategories];
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    try {
      const response = await apiClient<any>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          code: input.code,
          description: input.description,
        }),
      });
      if (response && response.id) {
        return {
          id: String(response.id),
          name: response.name || input.name,
          code: response.code || input.code,
          description: response.description || input.description,
          productsCount: 0,
          createdAt: new Date().toISOString(),
        };
      }
    } catch {
      // Fallback mock
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: input.name,
      code: input.code.toUpperCase(),
      description: input.description,
      productsCount: 0,
      createdAt: new Date().toISOString(),
    };
    mockCategories.unshift(newCategory);
    return newCategory;
  },

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      mockCategories[idx] = {
        ...mockCategories[idx],
        ...input,
        code: input.code ? input.code.toUpperCase() : mockCategories[idx].code,
      };
      return mockCategories[idx];
    }
    throw new Error('Category not found');
  },

  async deleteCategory(id: string): Promise<boolean> {
    mockCategories = mockCategories.filter((c) => c.id !== id);
    return true;
  },
};
