export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  productsCount: number;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  code?: string;
  description?: string;
}
