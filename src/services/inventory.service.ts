/**
 * Inventory Service — typed stubs
 * Base URL: NEXT_PUBLIC_INVENTORY_SERVICE_URL (Spring Boot, :8083)
 * Error shape: { success, message, data, errors } envelope
 *
 * IMPORTANT: ProductResponse fields are camelCase.
 *            CategoryResponse fields are snake_case.
 * All endpoints documented in .kiro/steering/backend-contracts-inventory-service.md
 */

import { inventoryRequest } from './api-client';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN' | 'REMOVED_BY_ADMIN';

export type CategoryResponse = {
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  product_count: number;
};

export type ProductJastiper = {
  userId: string;
  username: string | null;
  fullName: string | null;
  profilePictureUrl: string | null;
  avgRating: number;
  totalOrders: number;
};

export type ProductStats = {
  totalOrders: number;
  totalReviews: number;
  avgRating: number;
};

/** camelCase — no snake_case strategy on this DTO */
export type ProductResponse = {
  productId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
  originCountry: string;
  purchaseDate: string; // YYYY-MM-DD
  weightGram: number;
  serviceFee: number;
  images: string[];
  tags: string[];
  category: { id: number; name: string } | null;
  jastiper: ProductJastiper;
  stats: ProductStats;
};

export type PaginatedProducts = {
  data: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

// ---------------------------------------------------------------------------
// getCategories
// GET /categories
// Public — no token required
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<CategoryResponse[]> {
  return inventoryRequest<CategoryResponse[]>('/categories', {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// searchProducts
// GET /products
// Public — no token required
// ---------------------------------------------------------------------------

export type SearchProductsParams = {
  q?: string;
  jastiperId?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  origin_country?: string;
  purchase_date_from?: string;
  purchase_date_to?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'purchase_date' | 'rating';
  order?: 'asc' | 'desc';
};

export async function searchProducts(params?: SearchProductsParams): Promise<PaginatedProducts> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return inventoryRequest<PaginatedProducts>(`/products${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// getProduct
// GET /products/:id
// Public — no token required
// ---------------------------------------------------------------------------

export async function getProduct(productId: string): Promise<ProductResponse> {
  return inventoryRequest<ProductResponse>(`/products/${encodeURIComponent(productId)}`, {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// getJastiperCatalog
// GET /jastipers/:username/products
// Public — no token required
// ---------------------------------------------------------------------------

export type JastiperCatalogParams = {
  q?: string;
  min_price?: number;
  max_price?: number;
  category_id?: number;
  origin_country?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export async function getJastiperCatalog(
  username: string,
  params?: JastiperCatalogParams
): Promise<PaginatedProducts> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return inventoryRequest<PaginatedProducts>(
    `/jastipers/${encodeURIComponent(username)}/products${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  );
}

// ---------------------------------------------------------------------------
// getMyCatalog
// GET /products/my
// Protected — JASTIPER role required
// ---------------------------------------------------------------------------

export type MyCatalogParams = {
  search?: string;
  status?: ProductStatus;
  page?: number;
  size?: number;
  sort?: string;
};

export async function getMyCatalog(
  token: string,
  params?: MyCatalogParams
): Promise<PaginatedProducts> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return inventoryRequest<PaginatedProducts>(`/products/my${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// createProduct
// POST /products
// Protected — JASTIPER role required
// ---------------------------------------------------------------------------

export type CreateProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  origin_country: string;
  purchase_date: string; // YYYY-MM-DD
  category_id?: number;
  weight_gram?: number;
  service_fee?: number;
  images?: string[];
  tags?: string[];
};

export async function createProduct(
  token: string,
  input: CreateProductInput
): Promise<ProductResponse> {
  return inventoryRequest<ProductResponse>('/products', {
    method: 'POST',
    token,
    body: input,
  });
}

// ---------------------------------------------------------------------------
// updateProduct
// PATCH /products/:id
// Protected — JASTIPER role required (must own the product)
// ---------------------------------------------------------------------------

export type UpdateProductInput = Partial<{
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN';
  categoryId: number;
  originCountry: string;
  purchaseDate: string;
  serviceFee: number;
  weightGram: number;
  images: string[];
  tags: string[];
}>;

export async function updateProduct(
  token: string,
  productId: string,
  input: UpdateProductInput
): Promise<ProductResponse> {
  return inventoryRequest<ProductResponse>(`/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

// ---------------------------------------------------------------------------
// deleteProduct
// DELETE /products/:id
// Protected — JASTIPER role required (must own the product)
// ---------------------------------------------------------------------------

export async function deleteProduct(token: string, productId: string): Promise<void> {
  return inventoryRequest<void>(`/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    token,
  });
}
