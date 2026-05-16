/**
 * Order Service — typed stubs
 * Base URL: NEXT_PUBLIC_ORDER_SERVICE_URL (Rust/Axum, :8084)
 * Error shape: { success, message, data, errors } envelope
 *
 * All endpoints documented in .kiro/steering/backend-contracts-order-service.md
 */

import { orderRequest } from './api-client';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PURCHASED'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'REFUNDING'
  | 'REFUND_FAILED'
  | 'CANCELLED';

export type ActorRole = 'TITIPERS' | 'JASTIPER' | 'ADMIN' | 'SYSTEM';

export type ShippingAddress = {
  recipient_name: string;
  phone_number: string;
  street: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postal_code: string;
  notes: string | null;
};

export type ProductSnapshot = {
  product_id: string;
  name: string;
  description: string;
  image_url: string;
  origin_country: string;
  purchase_date: string;
  unit_price: number;
  service_fee: number;
};

export type Order = {
  order_id: string;
  titipers_id: string;
  jastiper_id: string;
  product_id: string;
  product_snapshot: ProductSnapshot;
  quantity: number;
  unit_price: number;
  service_fee: number;
  total_price: number;
  status: OrderStatus;
  shipping_address: ShippingAddress;
  note_to_jastiper: string | null;
  tracking_number: string | null;
  courier: string | null;
  cancellation_reason: string | null;
  cancelled_by: ActorRole | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaginatedOrders = {
  data: Order[];
  pagination: {
    total_items: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

export type OrderHistoryEntry = {
  status_his_id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string;
  actor_role: ActorRole;
  notes: string | null;
  timestamp: string;
};

// ---------------------------------------------------------------------------
// createOrder
// POST /orders
// Protected — any authenticated user (acts as TITIPERS)
// ---------------------------------------------------------------------------

export type CreateOrderInput = {
  product_id: string;
  quantity: number;
  shipping_address: ShippingAddress;
  note_to_jastiper?: string | null;
};

export async function createOrder(token: string, input: CreateOrderInput): Promise<Order> {
  return orderRequest<Order>('/orders', {
    method: 'POST',
    token,
    body: input,
  });
}

// ---------------------------------------------------------------------------
// getOrder
// GET /orders/:order_id
// Protected — buyer, jastiper, or admin of the order
// ---------------------------------------------------------------------------

export async function getOrder(token: string, orderId: string): Promise<Order> {
  return orderRequest<Order>(`/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// getMyPurchases
// GET /orders/my/purchases
// Protected — any authenticated user
// NOTE: This route must be resolved before /orders/:order_id in any client routing
// ---------------------------------------------------------------------------

export type OrderListParams = {
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'Asc' | 'Desc';
};

export async function getMyPurchases(
  token: string,
  params?: OrderListParams
): Promise<PaginatedOrders> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return orderRequest<PaginatedOrders>(`/orders/my/purchases${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// getMySales
// GET /orders/my/sales
// Protected — any authenticated user (typically JASTIPER)
// NOTE: This route must be resolved before /orders/:order_id in any client routing
// ---------------------------------------------------------------------------

export async function getMySales(
  token: string,
  params?: OrderListParams
): Promise<PaginatedOrders> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return orderRequest<PaginatedOrders>(`/orders/my/sales${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// payOrder
// PATCH /orders/:order_id/payment
// Protected — TITIPERS (must be the buyer)
// ---------------------------------------------------------------------------

export async function payOrder(token: string, orderId: string): Promise<Order> {
  return orderRequest<Order>(`/orders/${encodeURIComponent(orderId)}/payment`, {
    method: 'PATCH',
    token,
  });
}

// ---------------------------------------------------------------------------
// confirmOrder
// PATCH /orders/:order_id/confirm
// Protected — TITIPERS or ADMIN
// ---------------------------------------------------------------------------

export type ConfirmOrderResponse = {
  order_id: string;
  status: 'COMPLETED';
  completed_at: string;
};

export async function confirmOrder(
  token: string,
  orderId: string
): Promise<ConfirmOrderResponse> {
  return orderRequest<ConfirmOrderResponse>(`/orders/${encodeURIComponent(orderId)}/confirm`, {
    method: 'PATCH',
    token,
  });
}

// ---------------------------------------------------------------------------
// cancelOrder
// POST /orders/:order_id/cancel
// Protected — JASTIPER or ADMIN
// ---------------------------------------------------------------------------

export type CancelOrderInput = {
  cancellation_reason: string;
};

export async function cancelOrder(
  token: string,
  orderId: string,
  input: CancelOrderInput
): Promise<Order> {
  return orderRequest<Order>(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
    token,
    body: input,
  });
}

// ---------------------------------------------------------------------------
// getOrderHistory
// GET /orders/:order_id/history
// Protected — any party to the order
// ---------------------------------------------------------------------------

export async function getOrderHistory(
  token: string,
  orderId: string
): Promise<OrderHistoryEntry[]> {
  return orderRequest<OrderHistoryEntry[]>(`/orders/${encodeURIComponent(orderId)}/history`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// submitJastiperRating
// POST /orders/:order_id/rating/jastiper
// Protected — TITIPERS (must be the buyer)
// ---------------------------------------------------------------------------

export type JastiperRatingInput = {
  jastiper_rating: number; // 1.0–5.0
  jastiper_review?: string | null;
};

export type JastiperRatingResponse = {
  rating_id: string;
  order_id: string;
  jastiper_rating: number;
  created_at: string;
};

export async function submitJastiperRating(
  token: string,
  orderId: string,
  input: JastiperRatingInput
): Promise<JastiperRatingResponse> {
  return orderRequest<JastiperRatingResponse>(
    `/orders/${encodeURIComponent(orderId)}/rating/jastiper`,
    { method: 'POST', token, body: input }
  );
}

// ---------------------------------------------------------------------------
// submitProductRating
// POST /orders/:order_id/rating/product
// Protected — TITIPERS (must be the buyer)
// ---------------------------------------------------------------------------

export type ProductRatingInput = {
  product_rating: number; // 1.0–5.0
  product_review?: string | null;
  product_images?: string[];
};

export type ProductRatingResponse = {
  rating_id: string;
  order_id: string;
  product_rating: number;
  created_at: string;
};

export async function submitProductRating(
  token: string,
  orderId: string,
  input: ProductRatingInput
): Promise<ProductRatingResponse> {
  return orderRequest<ProductRatingResponse>(
    `/orders/${encodeURIComponent(orderId)}/rating/product`,
    { method: 'POST', token, body: input }
  );
}
