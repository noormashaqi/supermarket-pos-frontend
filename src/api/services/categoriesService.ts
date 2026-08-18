import { apiClient } from '../client';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../types';

export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    try {
      const data = await apiClient<any[]>('/api/Categories');
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
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
    return [];
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const response = await apiClient<any>('/api/Categories', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        code: input.code,
        description: input.description,
      }),
    });

    return {
      id: String(response?.id || Date.now()),
      name: response?.name || input.name,
      code: response?.code || input.code,
      description: response?.description || input.description,
      productsCount: 0,
      createdAt: new Date().toISOString(),
    };
  },

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const response = await apiClient<any>(`/api/Categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });

    return {
      id: String(id),
      name: response?.name || input.name || '',
      code: response?.code || input.code || '',
      description: response?.description || input.description || '',
      productsCount: 0,
      createdAt: new Date().toISOString(),
    };
  },

  async deleteCategory(id: string): Promise<boolean> {
    await apiClient(`/api/Categories/${id}`, { method: 'DELETE' });
    return true;
  },
};
