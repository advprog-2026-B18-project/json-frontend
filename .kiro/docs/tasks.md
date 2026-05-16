# JaStip Online Nasional (JSON) — Task List

## Module 0: Project Setup and Infrastructure

### Phase 1: Setup and Models
- [ ] TASK-001: Initialize Next.js 16 project with TypeScript strict mode, Tailwind CSS v4, and path alias @/* | Est: 1h
- [ ] TASK-002: Configure globals.css with CSS custom properties (--color-primary-dark, --color-primary, --color-secondary, --color-secondary-light) | Est: 0.5h
- [ ] TASK-003: Install and configure TanStack Query v5 (@tanstack/react-query, @tanstack/react-query-devtools) | Est: 0.5h
- [ ] TASK-004: Set up QueryClientProvider in root layout (src/app/layout.tsx) with client boundary | Est: 0.5h
- [ ] TASK-005: Set up AuthProvider in root layout (src/lib/auth/AuthProvider.tsx) wrapping the app | Est: 1h
- [ ] TASK-006: Configure environment variables in .env.local (NEXT_PUBLIC_AUTH_SERVICE_URL, NEXT_PUBLIC_INVENTORY_SERVICE_URL, NEXT_PUBLIC_ORDER_SERVICE_URL, NEXT_PUBLIC_PAYMENT_SERVICE_URL, JWT_SECRET) | Est: 0.5h
- [ ] TASK-007: Implement middleware.ts for /admin/* route protection using verifyJwt and isAdmin from src/lib/auth.ts | Est: 1h
- [ ] TASK-008: Implement src/lib/auth.ts with verifyJwt, isAdmin, isJastiper, isTitipers helper functions using jose | Est: 1h

### Phase 2: Service Layer Base
- [ ] TASK-009: Implement src/services/api-client.ts with apiFetchFrom, authFetch, paymentFetch, inventoryFetch, ordersFetch, appFetch, ApiError class, and isApiError type guard | Est: 2h
- [ ] TASK-010: Implement dual error normalization in api-client.ts: handle both { success, message } envelope (Auth/Inventory/Order) and RFC 9457 Problem Details (Payment) into unified ApiError shape | Est: 1.5h

### Phase 3: BFF Route Handlers
- [ ] TASK-011: Implement POST /api/auth/login BFF route (src/app/api/auth/login/route.ts) — proxies to Auth Service, sets refresh_token HttpOnly cookie, returns access_token in body | Est: 1h
- [ ] TASK-012: Implement POST /api/auth/logout BFF route (src/app/api/auth/logout/route.ts) — clears refresh_token cookie | Est: 0.5h
- [ ] TASK-013: Implement POST /api/auth/refresh-token BFF route (src/app/api/auth/refresh-token/route.ts) — reads refresh_token cookie, calls Auth Service, sets new cookie | Est: 1h

---

## Module 1: Auth and Profile

### Phase 1: Setup and Models
- [ ] TASK-101: Define TypeScript types for Auth Service responses: LoginResponse, RegisterResponse, ProfileResponse, PublicProfileResponse, KYCStatusResponse, AdminUserListResponse, AdminKYCListResponse. NOTE: LoginResponse token field is `data.refresh_token` (not `access_token`) — this is the access token despite the field name. AdminUserListResponse pagination shape is `{ page, limit, total }` — no `total_pages` field in auth service pagination. | Est: 1h

### Phase 2: Service Layer
- [ ] TASK-102: Implement src/services/auth.service.ts — register(email, password, passwordConfirmation, role) | Est: 0.5h
- [ ] TASK-103: Implement auth.service.ts — login(email, password) via BFF /api/auth/login. NOTE: read the access token from `data.refresh_token` field in the response (backend naming quirk). | Est: 0.5h
- [ ] TASK-104: Implement auth.service.ts — logout() via BFF /api/auth/logout | Est: 0.5h
- [ ] TASK-105: Implement auth.service.ts — refreshToken() via BFF /api/auth/refresh-token | Est: 0.5h
- [ ] TASK-106: Implement auth.service.ts — getMyProfile() GET /profile/me | Est: 0.5h
- [ ] TASK-107: Implement auth.service.ts — updateMyProfile(data) PATCH /profile/me | Est: 0.5h
- [ ] TASK-108: Implement auth.service.ts — getPublicProfile(username) GET /profile/{username} | Est: 0.5h
- [ ] TASK-109: Implement auth.service.ts — submitKYC(data) POST /profile/me/kyc | Est: 0.5h
- [ ] TASK-110: Implement auth.service.ts — getMyKYCStatus() GET /profile/me/kyc | Est: 0.5h
- [ ] TASK-111: Implement auth.service.ts — adminListUsers(params) GET /admin/users | Est: 0.5h
- [ ] TASK-112: Implement auth.service.ts — adminGetUser(userId) GET /admin/users/{userId} | Est: 0.5h
- [ ] TASK-113: Implement auth.service.ts — adminListKYC(params) GET /admin/kyc | Est: 0.5h
- [ ] TASK-114: Implement auth.service.ts — adminReviewKYC(kycId, action, rejectionReason) PATCH /admin/kyc/{kycId}/review — NOTE: field name is rejection-reason with hyphen | Est: 1h
- [ ] TASK-115: Implement useAuthorizedFetch hook in src/lib/api/useAuthorizedFetch.ts — attaches Bearer token, retries on 401 with refresh | Est: 2h

### Phase 3: API Integration
- [ ] TASK-116: Implement AuthProvider context (src/lib/auth/AuthProvider.tsx) with accessToken state, setAccessToken, clearAuth, and auto-refresh on mount | Est: 2h

### Phase 4: Frontend Pages and Components
- [ ] TASK-117: Build /login page (src/app/login/page.tsx) — email/password form, React 19 form action, role-based redirect on success | Est: 2h
- [ ] TASK-118: Build /register page (src/app/register/page.tsx) — role selector, registration form, per-field validation errors | Est: 2h
- [ ] TASK-119: Build /profile page (src/app/profile/page.tsx) — profile edit form, username validation, KYC status link | Est: 2h
- [ ] TASK-120: Build /profile/kyc page (src/app/profile/kyc/page.tsx) — KYC submission form with dynamic social_media_links, ktp_number 16-digit validation | Est: 3h
- [ ] TASK-121: Build /jastiper/[username] public profile page (src/app/jastiper/[username]/page.tsx) — profile header, stats, badges, product catalog | Est: 3h
- [ ] TASK-122: Build /admin/users page (src/app/admin/users/page.tsx) — user table with filters, ban/unban actions | Est: 3h
- [ ] TASK-123: Build /admin/users/[userId] page (src/app/admin/users/[userId]/page.tsx) — full user detail with KYC info and stats | Est: 2h
- [ ] TASK-124: Build /admin/kyc page (src/app/admin/kyc/page.tsx) — KYC queue with review modal, approve/reject actions | Est: 3h

### Phase 5: Integration and Testing
- [ ] TASK-125: Test login flow end-to-end: login, token stored in context, auto-refresh on 401, logout clears cookie | Est: 2h
- [ ] TASK-126: Test KYC submission and admin review flow end-to-end | Est: 1h
- [ ] TASK-127: Verify rejection-reason hyphen field name is sent correctly in KYC review request | Est: 0.5h

---

## Module 2: Inventory and Catalog

### Phase 1: Setup and Models
- [ ] TASK-201: Define TypeScript types for Inventory Service responses: ProductResponse (camelCase), CategoryResponse (snake_case), PaginatedProductResponse, StockReservationResponse. NOTE: Inventory service pagination shape is `{ page, limit, total, total_pages }` (uses "total" not "total_items"). Order service pagination shape is `{ total_items, page, limit, total_pages }` (uses "total_items"). These are two different shapes — define separate pagination types for each service. | Est: 1h
- [ ] TASK-202: Note and document the camelCase/snake_case inconsistency: ProductResponse uses camelCase (productId, originCountry), CategoryResponse uses snake_case (category_id, product_count) | Est: 0.5h

### Phase 2: Service Layer
- [ ] TASK-203: Implement src/services/inventory.service.ts — getCategories() GET /categories | Est: 0.5h
- [ ] TASK-204: Implement inventory.service.ts — searchProducts(params) GET /products with all filter params | Est: 1h
- [ ] TASK-205: Implement inventory.service.ts — getProduct(id) GET /products/{id} | Est: 0.5h
- [ ] TASK-206: Implement inventory.service.ts — getJastiperCatalog(username, params) GET /jastipers/{username}/products | Est: 0.5h
- [ ] TASK-207: Implement inventory.service.ts — createProduct(data) POST /products | Est: 0.5h
- [ ] TASK-208: Implement inventory.service.ts — updateProduct(id, data) PATCH /products/{id} | Est: 0.5h
- [ ] TASK-209: Implement inventory.service.ts — deleteProduct(id) DELETE /products/{id} | Est: 0.5h
- [ ] TASK-210: Implement inventory.service.ts — getMyProducts(params) GET /products/my | Est: 0.5h
- [ ] TASK-211: Implement inventory.service.ts — getMyProduct(id) GET /products/my/{id} | Est: 0.5h
- [ ] TASK-212: Implement inventory.service.ts — adminGetAllProducts(params) GET /admin/products | Est: 0.5h
- [ ] TASK-213: Implement inventory.service.ts — adminModerateProduct(id, action, reason) PATCH /admin/products/{id}/moderate | Est: 0.5h
- [ ] TASK-214: Implement inventory.service.ts — adminCreateCategory(data) POST /admin/categories | Est: 0.5h
- [ ] TASK-215: Implement inventory.service.ts — adminUpdateCategory(id, data) PATCH /admin/categories/{id} | Est: 0.5h
- [ ] TASK-216: Implement inventory.service.ts — adminDeleteCategory(id) DELETE /admin/categories/{id} | Est: 0.5h

### Phase 4: Frontend Pages and Components
- [ ] TASK-217: Build / landing page (src/app/page.tsx) — hero, featured products, how it works, top jastipers, category links | Est: 4h
- [ ] TASK-218: Build /catalog page (src/app/catalog/page.tsx) — product search with filters, pagination, URL param sync | Est: 4h
- [ ] TASK-219: Build /catalog/[productId] page (src/app/catalog/[productId]/page.tsx) — product detail, image gallery, jastiper info, checkout button logic | Est: 3h
- [ ] TASK-220: Build /jastiper/catalog page (src/app/jastiper/catalog/page.tsx) — own catalog with all statuses, hide/show/delete actions | Est: 3h
- [ ] TASK-221: Build /jastiper/catalog/new page (src/app/jastiper/catalog/new/page.tsx) — product creation form | Est: 3h
- [ ] TASK-222: Build /jastiper/catalog/[productId]/edit page (src/app/jastiper/catalog/[productId]/edit/page.tsx) — product edit form pre-filled | Est: 2h
- [ ] TASK-223: Build /admin/catalog page (src/app/admin/catalog/page.tsx) — all products with moderation actions | Est: 3h

### Phase 5: Integration and Testing
- [ ] TASK-224: Test product search with all filter combinations | Est: 1h
- [ ] TASK-225: Test product creation and update with camelCase/snake_case field handling | Est: 1h
- [ ] TASK-226: Test admin moderation actions (HIDE, REMOVE, RESTORE, ACTIVATE) | Est: 1h

---

## Module 3: Order Management

### Phase 1: Setup and Models
- [ ] TASK-301: Define TypeScript types for Order Service responses: Order, ShippingAddress, ProductSnapshot, OrderHistory, JastiperRating, ProductRating, PaginatedOrderResponse. NOTE: `cancelled_by` in Order is a role string (`"TITIPERS" | "JASTIPER" | "ADMIN" | "SYSTEM" | null`), not a user ID. OrderHistory entry fields: status_his_id, order_id, status, changed_by (actor UUID), actor_role, notes, timestamp. | Est: 1h
- [ ] TASK-302: Define order status enum and valid transition map for frontend validation | Est: 0.5h

### Phase 2: Service Layer
- [ ] TASK-303: Implement src/services/order.service.ts — createOrder(data) POST /orders | Est: 1h
- [ ] TASK-304: Implement order.service.ts — getOrder(orderId) GET /orders/{order_id} | Est: 0.5h
- [ ] TASK-305: Implement order.service.ts — payOrder(orderId) PATCH /orders/{order_id}/payment | Est: 0.5h
- [ ] TASK-306: Implement order.service.ts — confirmOrder(orderId) PATCH /orders/{order_id}/confirm | Est: 0.5h
- [ ] TASK-307: Implement order.service.ts — markPurchased(orderId) PATCH /orders/{order_id}/purchased | Est: 0.5h
- [ ] TASK-308: Implement order.service.ts — markShipped(orderId, trackingNumber, courier) PATCH /orders/{order_id}/shipped | Est: 0.5h
- [ ] TASK-309: Implement order.service.ts — cancelOrder(orderId, cancellationReason) POST /orders/{order_id}/cancel | Est: 0.5h
- [ ] TASK-310: Implement order.service.ts — getOrderHistory(orderId) GET /orders/{order_id}/history | Est: 0.5h
- [ ] TASK-311: Implement order.service.ts — getMyPurchases(params) GET /orders/my/purchases | Est: 0.5h
- [ ] TASK-312: Implement order.service.ts — getMySales(params) GET /orders/my/sales | Est: 0.5h
- [ ] TASK-313: Implement order.service.ts — rateJastiper(orderId, rating, review) POST /orders/{order_id}/rating/jastiper | Est: 0.5h
- [ ] TASK-314: Implement order.service.ts — rateProduct(orderId, rating, review, images) POST /orders/{order_id}/rating/product | Est: 0.5h
- [ ] TASK-315: Implement order.service.ts — getJastiperRating(orderId) GET /orders/{order_id}/rating/jastiper | Est: 0.5h
- [ ] TASK-316: Implement order.service.ts — getProductRating(orderId) GET /orders/{order_id}/rating/product | Est: 0.5h

### Phase 4: Frontend Pages and Components
- [ ] TASK-317: Build /checkout/[productId] page (src/app/checkout/[productId]/page.tsx) — order form with shipping address, wallet balance check, quantity selector. NOTE: Use camelCase ProductResponse fields for price display (`product.price`, `product.serviceFee`, `product.stock`, `product.productId`) since ProductResponse from GET /products/{id} uses camelCase. | Est: 4h
- [ ] TASK-318: Build /orders page (src/app/orders/page.tsx) — purchase history with status filter tabs, pagination | Est: 2h
- [ ] TASK-319: Build /orders/[orderId] page (src/app/orders/[orderId]/page.tsx) — order detail with status timeline, action buttons, rating forms | Est: 4h
- [ ] TASK-320: Build /jastiper/orders page (src/app/jastiper/orders/page.tsx) — incoming orders with action buttons | Est: 3h
- [ ] TASK-321: Build /jastiper/orders/[orderId] page (src/app/jastiper/orders/[orderId]/page.tsx) — jastiper order detail with mark purchased/shipped/cancel actions | Est: 3h
- [ ] TASK-322: Build /admin/orders page (src/app/admin/orders/page.tsx) — all orders with filters and cancel action | Est: 3h

### Phase 5: Integration and Testing
- [ ] TASK-323: ⚠️ CONCURRENCY: Test checkout stock reservation — verify two concurrent requests for last unit result in exactly one success | Est: 2h
- [ ] TASK-324: Test full order lifecycle: checkout → pay → purchased → shipped → completed → rate | Est: 2h
- [ ] TASK-325: Test cancellation flows: PENDING→CANCELLED, PAID→REFUNDING→CANCELLED, SHIPPED→REFUNDING (ADMIN only) | Est: 2h
- [ ] TASK-326: Test invalid status transitions return 422 with valid_transitions in response | Est: 1h

---

## Module 4: Wallet and Transactions

### Phase 1: Setup and Models
- [ ] TASK-401: Define TypeScript types for Payment Service responses: WalletResponse, AdminWalletResponse, TransactionResponse, TransactionDetailResponse, TopUpResponse, WithdrawalResponse, AdminTransactionListResponse, AdjustmentResponse. NOTE: WalletResponse (from GET /wallets/me) only has `wallet_id`, `user_id`, `balance` — no escrow or lifetime fields. AdminWalletResponse (from GET /admin/wallets/{id}) has the full object including `escrow_balance`, `total_topup_lifetime`, `total_withdrawal_lifetime`, `created_at`, `updated_at`. These are two distinct types. | Est: 1h
- [ ] TASK-402: Note RFC 9457 Problem Details error format for Payment Service — all errors use { type, title, status, detail, instance } not { success, message } | Est: 0.5h

### Phase 2: Service Layer
- [ ] TASK-403: Implement src/services/payment.service.ts — getMyWallet() GET /wallets/me | Est: 0.5h
- [ ] TASK-404: Implement payment.service.ts — getTransactions() GET /transactions | Est: 0.5h
- [ ] TASK-405: Implement payment.service.ts — getTransaction(transactionId) GET /transactions/{transactionId} | Est: 0.5h
- [ ] TASK-406: Implement payment.service.ts — getTopUps() GET /topups | Est: 0.5h
- [ ] TASK-407: Implement payment.service.ts — createTopUp(amount, paymentMethod, bankCode, idempotencyKey) POST /topups — NOTE: all fields snake_case, idempotency_key must be unique | Est: 1h
- [ ] TASK-408: Implement payment.service.ts — getWithdrawals() GET /withdrawals | Est: 0.5h
- [ ] TASK-409: Implement payment.service.ts — createWithdrawal(amount, bankAccountId, idempotencyKey, notes) POST /withdrawals — NOTE: all fields snake_case | Est: 1h
- [ ] TASK-410: Implement payment.service.ts — adminGetTopUps(status) GET /admin/topups | Est: 0.5h
- [ ] TASK-411: Implement payment.service.ts — adminProcessTopUp(transactionId, action, rejectionReason) PATCH /admin/topups/{transaction_id} | Est: 0.5h
- [ ] TASK-412: Implement payment.service.ts — adminGetWithdrawals(status) GET /admin/withdrawals | Est: 0.5h
- [ ] TASK-413: Implement payment.service.ts — adminProcessWithdrawal(transactionId, action, rejectionReason) PATCH /admin/withdrawals/{transaction_id} | Est: 0.5h
- [ ] TASK-414: Implement payment.service.ts — adminGetAllTransactions(params) GET /admin/transactions | Est: 0.5h
- [ ] TASK-415: Implement payment.service.ts — adminGetWallet(userId) GET /admin/wallets/{userQueryId} | Est: 0.5h
- [ ] TASK-416: Implement payment.service.ts — adminCreateWallet(userId) POST /admin/wallets/{userId} | Est: 0.5h
- [ ] TASK-417: Implement payment.service.ts — adminAdjustWallet(userId, direction, amount, reason, referenceId) POST /admin/wallets/{user_id}/adjust | Est: 0.5h

### Phase 3: API Integration
- [ ] TASK-418: ⚠️ CONCURRENCY: Implement idempotency_key generation in payment.service.ts using crypto.randomUUID() for top-up and withdrawal requests | Est: 0.5h
- [ ] TASK-419: ⚠️ CONCURRENCY: Implement wallet balance pre-check for the "Bayar Sekarang" button on the order detail page (/orders/[orderId]) — fetch GET /wallets/me and compare balance to order total_price before enabling the pay button. NOTE: This check is on the ORDER DETAIL page, not the checkout form submission. The checkout page (POST /orders) creates the order first; the pay button appears on the subsequent order detail page. | Est: 1h

### Phase 4: Frontend Pages and Components
- [ ] TASK-420: Build /wallet page (src/app/wallet/page.tsx) — wallet balance, top-up form, transaction history with filter tabs | Est: 4h
- [ ] TASK-421: Build /jastiper/wallet page (src/app/jastiper/wallet/page.tsx) — wallet balance, withdrawal form, earnings history | Est: 3h
- [ ] TASK-422: Build /admin/wallet page (src/app/admin/wallet/page.tsx) — financial summary, pending top-ups/withdrawals, all transactions, manual adjustment | Est: 5h

### Phase 5: Integration and Testing
- [ ] TASK-423: ⚠️ CONCURRENCY: Test wallet deduction during checkout — verify two concurrent checkouts exceeding balance result in exactly one success | Est: 2h
- [ ] TASK-424: Test top-up flow: submit → pending → admin approve → balance credited | Est: 1h
- [ ] TASK-425: Test withdrawal flow: submit → balance deducted → pending → admin process | Est: 1h
- [ ] TASK-426: Test idempotency_key uniqueness — duplicate key returns 409 | Est: 0.5h
- [ ] TASK-427: Test RFC 9457 error parsing in payment.service.ts — verify detail field is read, not message | Est: 1h
- [ ] TASK-428: Test escrow flow: checkout deducts balance → escrow holds → COMPLETED releases to jastiper → CANCELLED refunds to titiper | Est: 2h

---

## Module 5: Shared Components and Layout

### Phase 4: Frontend Pages and Components
- [ ] TASK-501: Build Navbar component (src/components/Navbar.tsx) — role-based nav links, user avatar dropdown, wallet balance, guest buttons | Est: 3h
- [ ] TASK-502: Build Sidebar component (src/components/Sidebar.tsx) — jastiper and admin navigation, active state, mobile collapse | Est: 2h
- [ ] TASK-503: Build ProductCard component (src/components/ProductCard.tsx) — product image, name, price, jastiper info, rating, stock, status badge | Est: 2h
- [ ] TASK-504: Build OrderCard component (src/components/OrderCard.tsx) — order summary with role-based action buttons | Est: 2h
- [ ] TASK-505: Build StatusBadge component (src/components/StatusBadge.tsx) — color-coded pill for all status values | Est: 1h
- [ ] TASK-506: Build WalletSummary component (src/components/WalletSummary.tsx) — balance display, escrow note, top-up/withdraw buttons | Est: 1h
- [ ] TASK-507: Build RatingStars component (src/components/RatingStars.tsx) — interactive and read-only star rating display | Est: 1.5h
- [ ] TASK-509: Build KYCStatusBanner component (src/components/KYCStatusBanner.tsx) — contextual banner for all KYC statuses | Est: 1h
- [ ] TASK-510: Build TransactionRow component (src/components/TransactionRow.tsx) — transaction list item with type, amount, direction, status | Est: 1h
- [ ] TASK-511: Build SearchBar component (src/components/SearchBar.tsx) — debounced search input with clear button | Est: 1h
- [ ] TASK-512: Build EmptyState component (src/components/EmptyState.tsx) — centered empty state with icon, title, description, action | Est: 0.5h
- [ ] TASK-513: Build LoadingSpinner component (src/components/LoadingSpinner.tsx) — animated circular spinner | Est: 0.5h
- [ ] TASK-514: Build SkeletonLoader component (src/components/SkeletonLoader.tsx) — animated placeholder blocks for card, row, text, avatar variants | Est: 1h
- [ ] TASK-515: Build ConfirmModal component (src/components/ConfirmModal.tsx) — accessible modal dialog with confirm/cancel, loading state, optional children | Est: 1.5h
- [ ] TASK-516: Build Pagination component (src/components/Pagination.tsx) — page navigation with ellipsis, item count display | Est: 1h
- [ ] TASK-517: Build Toast/Notification component (src/components/Toast.tsx) — auto-dismissing toast with type variants, stacking | Est: 1.5h

### Phase 5: Integration and Testing
- [ ] TASK-518: Build /dashboard page (src/app/dashboard/page.tsx) — titiper dashboard with stats, wallet, recent orders, KYC banner | Est: 3h
- [ ] TASK-519: Build /jastiper/dashboard page (src/app/jastiper/dashboard/page.tsx) — jastiper dashboard with sales stats, wallet, incoming orders | Est: 3h
- [ ] TASK-520: Build /admin/dashboard page (src/app/admin/dashboard/page.tsx) — platform stats, pending actions, financial summary | Est: 3h
- [ ] TASK-523: Integration test: verify all pages render correctly with loading, empty, and error states | Est: 3h
- [ ] TASK-524: Accessibility audit: verify all interactive components have proper aria labels, roles, and keyboard navigation | Est: 2h
- [ ] TASK-525: Cross-browser test: verify layout and functionality in Chrome, Firefox, Safari | Est: 2h

