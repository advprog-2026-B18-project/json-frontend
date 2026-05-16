/**
 * Inventory Service — src/services/inventory.service.ts
 *
 * Base URL: NEXT_PUBLIC_INVENTORY_SERVICE_URL (Spring Boot, :8083)
 * Error shape: { success, message, data, errors } envelope
 *
 * Backend contracts: .kiro/steering/backend-contracts-inventory-service.md
 */

import { inventoryRequest } from './api-client';

export { isApiError } from './api-client';

// ---------------------------------------------------------------------------
// TASK-201 + TASK-202: Types
//
// CRITICAL NAMING INCONSISTENCY — two different JSON naming strategies:
//
//   ProductResponse  → camelCase  (productId, originCountry, purchaseDate, serviceFee, weightGram)
//   CategoryResponse → snake_case (category_id, product_count, slug)
//
// This inconsistency exists in the backend and cannot be changed.
// ProductResponse uses no @JsonNaming annotation (defaults to camelCase).
// CategoryResponse uses @JsonNaming(SnakeCaseStrategy).
// Frontend TypeScript types MUST reflect this difference exactly.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pagination shapes
//
// Inventory service pagination: { page, limit, total, total_pages }
//   - uses "total" (not "total_items")
//
// Order service pagination:     { total_items, page, limit, total_pages }
//   - uses "total_items" (not "total")
//
// These are DIFFERENT shapes. Define separate named types for each.
// ---------------------------------------------------------------------------

/** Pagination shape returned by the Inventory Service */
export type InventoryPagination = {
  page: number;
  limit: number;
  /** Total number of items — NOTE: "total", not "total_items" */
  total: number;
  total_pages: number;
};

/**
 * Pagination shape returned by the Order Service.
 * Exported here for reference — defined in order.service.ts as well.
 * NOTE: uses "total_items", not "total".
 */
export type OrderPagination = {
  total_items: number;
  page: number;
  limit: number;
  total_pages: number;
};

// ---------------------------------------------------------------------------
// CategoryResponse — snake_case (via @JsonNaming(SnakeCaseStrategy))
// ---------------------------------------------------------------------------

/**
 * CategoryResponse — all fields are snake_case.
 * Returned by GET /categories, POST /admin/categories, PATCH /admin/categories/{id}.
 */
export type CategoryResponse = {
  category_id: number;   // integer, NOT a UUID
  name: string;
  slug: string;
  description: string | null;
  product_count: number;
};

// ---------------------------------------------------------------------------
// ProductResponse — camelCase (no @JsonNaming annotation)
// ---------------------------------------------------------------------------

export type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN' | 'REMOVED_BY_ADMIN';

/**
 * Jastiper info embedded in ProductResponse.
 * All fields are camelCase.
 */
export type ProductJastiper = {
  userId: string;
  username: string | null;
  fullName: string | null;
  profilePictureUrl: string | null;
  avgRating: number;
  totalOrders: number;
};

/**
 * Stats embedded in ProductResponse.
 * All fields are camelCase.
 */
export type ProductStats = {
  totalOrders: number;
  totalReviews: number;
  avgRating: number;
};

/**
 * ProductResponse — all fields are camelCase.
 *
 * IMPORTANT: This is different from CategoryResponse which uses snake_case.
 * Always access fields as: product.productId, product.originCountry,
 * product.purchaseDate, product.serviceFee, product.weightGram — NOT
 * product.product_id, product.origin_country, etc.
 */
export type ProductResponse = {
  productId: string;
  name: string;
  description: string;
  price: number;           // IDR integer, no decimals
  stock: number;
  status: ProductStatus;
  originCountry: string;
  purchaseDate: string;    // YYYY-MM-DD (LocalDate, not full ISO datetime)
  weightGram: number;
  serviceFee: number;      // IDR integer, no decimals
  images: string[];        // max 5 URLs
  tags: string[];
  category: { id: number; name: string } | null;
  jastiper: ProductJastiper;
  stats: ProductStats;
};

// ---------------------------------------------------------------------------
// Paginated response wrappers
// ---------------------------------------------------------------------------

/**
 * PaginatedProductResponse — wraps ProductResponse[] with InventoryPagination.
 * Returned by GET /products, GET /products/my, GET /jastipers/{username}/products,
 * GET /admin/products.
 */
export type PaginatedProductResponse = {
  data: ProductResponse[];
  pagination: InventoryPagination;
};

/** @deprecated Use PaginatedProductResponse instead */
export type PaginatedProducts = PaginatedProductResponse;

// ---------------------------------------------------------------------------
// StockReservationResponse
// Returned by POST /internal/products/{id}/stock/reserve
// NOTE: This is an internal endpoint — never called from the frontend.
//       Defined here for completeness and type documentation only.
//       The response is NOT wrapped in the standard ApiResponse envelope.
// ---------------------------------------------------------------------------

export type StockReservationStatus = 'RESERVED';

/**
 * StockReservationResponse — raw JSON, NOT wrapped in ApiResponse envelope.
 * Fields are camelCase (consistent with ProductResponse).
 */
export type StockReservationResponse = {
  productId: string;
  reservedQuantity: number;
  remainingStock: number;
  reservationId: string;
  status: StockReservationStatus;
};

// ---------------------------------------------------------------------------
// Admin types
// ---------------------------------------------------------------------------

export type ModerationAction = 'HIDE' | 'REMOVE' | 'RESTORE' | 'ACTIVATE';

// ---------------------------------------------------------------------------
// TASK-203: getCategories
// GET /categories
// Public — no token required
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<CategoryResponse[]> {
  return inventoryRequest<CategoryResponse[]>('/categories', { method: 'GET' });
}

// ---------------------------------------------------------------------------
// TASK-204: searchProducts
// GET /products
// Public — no token required
// Only returns ACTIVE products. HIDDEN and REMOVED_BY_ADMIN are filtered server-side.
// ---------------------------------------------------------------------------

export type SearchProductsParams = {
  q?: string;
  jastiperId?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  origin_country?: string;
  purchase_date_from?: string; // YYYY-MM-DD
  purchase_date_to?: string;   // YYYY-MM-DD
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'purchase_date' | 'rating';
  order?: 'asc' | 'desc';
};

export async function searchProducts(
  params?: SearchProductsParams
): Promise<PaginatedProductResponse> {
  const query = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
  }
  const qs = query.toString();
  return inventoryRequest<PaginatedProductResponse>(`/products${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// TASK-205: getProduct
// GET /products/{id}
// Public — no token required
// ---------------------------------------------------------------------------

export async function getProduct(productId: string): Promise<ProductResponse> {
  return inventoryRequest<ProductResponse>(
    `/products/${encodeURIComponent(productId)}`,
    { method: 'GET' }
  );
}

// ---------------------------------------------------------------------------
// TASK-206: getJastiperCatalog
// GET /jastipers/{username}/products
// Public — no token required
// Only returns ACTIVE products.
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
): Promise<PaginatedProductResponse> {
  const query = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
  }
  const qs = query.toString();
  return inventoryRequest<PaginatedProductResponse>(
    `/jastipers/${encodeURIComponent(username)}/products${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  );
}

// ---------------------------------------------------------------------------
// TASK-207: createProduct
// POST /products
// Protected — JASTIPER role required
// Returns HTTP 201
// Request body uses snake_case field names.
// ---------------------------------------------------------------------------

export type CreateProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  origin_country: string;
  purchase_date: string;   // YYYY-MM-DD
  category_id?: number;
  weight_gram?: number;
  service_fee?: number;
  images?: string[];       // max 5
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
// TASK-208: updateProduct
// PATCH /products/{id}
// Protected — JASTIPER role required (must own the product)
// Request body uses camelCase field names (matches PATCH contract).
// Jastiper can set status to HIDDEN but NOT to REMOVED_BY_ADMIN.
// ---------------------------------------------------------------------------

export type UpdateProductInput = Partial<{
  name: string;
  description: string;
  price: number;
  stock: number;
  /** Jastiper can set ACTIVE, OUT_OF_STOCK, or HIDDEN — not REMOVED_BY_ADMIN */
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN';
  categoryId: number;
  originCountry: string;
  purchaseDate: string;    // YYYY-MM-DD
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
  return inventoryRequest<ProductResponse>(
    `/products/${encodeURIComponent(productId)}`,
    { method: 'PATCH', token, body: input }
  );
}

// ---------------------------------------------------------------------------
// TASK-209: deleteProduct
// DELETE /products/{id}
// Protected — JASTIPER role required (must own the product)
// Soft-delete: sets deleted_at. Returns HTTP 200.
// Blocked if product has active orders (HTTP 409 with active_orders array).
// ---------------------------------------------------------------------------

export async function deleteProduct(token: string, productId: string): Promise<void> {
  return inventoryRequest<void>(
    `/products/${encodeURIComponent(productId)}`,
    { method: 'DELETE', token }
  );
}

// ---------------------------------------------------------------------------
// TASK-210: getMyProducts
// GET /products/my
// Protected — JASTIPER role required
// Returns ALL statuses including HIDDEN and REMOVED_BY_ADMIN.
// Uses Spring Pageable: page is 0-based internally, pass page number as-is.
// ---------------------------------------------------------------------------

export type MyCatalogParams = {
  search?: string;
  status?: ProductStatus;
  page?: number;
  size?: number;
  sort?: string; // e.g. 'createdAt,desc'
};

export async function getMyProducts(
  token: string,
  params?: MyCatalogParams
): Promise<PaginatedProductResponse> {
  const query = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
  }
  const qs = query.toString();
  return inventoryRequest<PaginatedProductResponse>(`/products/my${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

/** @deprecated Use getMyProducts instead */
export const getMyCatalog = getMyProducts;

// ---------------------------------------------------------------------------
// TASK-211: getMyProduct
// GET /products/my/{id}
// Protected — JASTIPER role required (must own the product)
// ---------------------------------------------------------------------------

export async function getMyProduct(
  token: string,
  productId: string
): Promise<ProductResponse> {
  return inventoryRequest<ProductResponse>(
    `/products/my/${encodeURIComponent(productId)}`,
    { method: 'GET', token }
  );
}

// ---------------------------------------------------------------------------
// TASK-212: adminGetAllProducts
// GET /admin/products
// Protected — ADMIN role required
// Returns ALL statuses including HIDDEN and REMOVED_BY_ADMIN.
// ---------------------------------------------------------------------------

export type AdminGetProductsParams = {
  q?: string;
  jastiperId?: string;
  status?: ProductStatus;
  categoryId?: number;
  page?: number;
  size?: number;
  sort?: string;
};

export async function adminGetAllProducts(
  token: string,
  params?: AdminGetProductsParams
): Promise<PaginatedProductResponse> {
  const query = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
  }
  const qs = query.toString();
  return inventoryRequest<PaginatedProductResponse>(`/admin/products${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// TASK-213: adminModerateProduct
// PATCH /admin/products/{id}/moderate
// Protected — ADMIN role required
// action effects:
//   HIDE    → status = HIDDEN
//   REMOVE  → status = HIDDEN, deleted_at set (soft delete)
//   RESTORE → status = ACTIVE, deleted_at cleared
//   ACTIVATE → status = ACTIVE, deleted_at cleared
// reason is required and logged in the moderation log.
// ---------------------------------------------------------------------------

export async function adminModerateProduct(
  token: string,
  productId: string,
  action: ModerationAction,
  reason: string
): Promise<ProductResponse> {
  return inventoryRequest<ProductResponse>(
    `/admin/products/${encodeURIComponent(productId)}/moderate`,
    { method: 'PATCH', token, body: { action, reason } }
  );
}

// ---------------------------------------------------------------------------
// TASK-214: adminCreateCategory
// POST /admin/categories
// Protected — ADMIN role required
// Returns HTTP 201
// ---------------------------------------------------------------------------

export type CreateCategoryInput = {
  name: string;           // required, max 100 chars
  description?: string;   // optional, max 500 chars
  slug?: string;          // optional, auto-generated from name if omitted
};

export async function adminCreateCategory(
  token: string,
  input: CreateCategoryInput
): Promise<CategoryResponse> {
  return inventoryRequest<CategoryResponse>('/admin/categories', {
    method: 'POST',
    token,
    body: input,
  });
}

// ---------------------------------------------------------------------------
// TASK-215: adminUpdateCategory
// PATCH /admin/categories/{id}
// Protected — ADMIN role required
// id is an integer (auto-increment), NOT a UUID.
// ---------------------------------------------------------------------------

export async function adminUpdateCategory(
  token: string,
  categoryId: number,
  input: CreateCategoryInput
): Promise<CategoryResponse> {
  return inventoryRequest<CategoryResponse>(`/admin/categories/${categoryId}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

// ---------------------------------------------------------------------------
// TASK-216: adminDeleteCategory
// DELETE /admin/categories/{id}
// Protected — ADMIN role required
// Returns HTTP 409 with product_count if products are still assigned.
// ---------------------------------------------------------------------------

export async function adminDeleteCategory(
  token: string,
  categoryId: number
): Promise<void> {
  return inventoryRequest<void>(`/admin/categories/${categoryId}`, {
    method: 'DELETE',
    token,
  });
}
