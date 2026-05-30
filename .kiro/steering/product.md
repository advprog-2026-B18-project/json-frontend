# Product: JSON (JaStip Online Nasional)

JSON is a marketplace platform connecting two user roles:

- **TITIPERS** – customers who place orders (titip/jastip requests)
- **JASTIPER** – couriers/agents who fulfill those orders

Core capabilities:
- User registration and authentication (role-based: TITIPERS, JASTIPER, ADMIN)
- Product catalog browsing
- Order management
- Integrated digital wallet with top-up, payment, earning, and withdrawal flows
- KYC (identity verification) for users
- Admin panel for user management, KYC review, and wallet operations

The UI language is a mix of Indonesian and English. Error messages and labels lean Indonesian (`"Login gagal"`, `"Memuat..."`, `"Dompet JSON Saya"`).

## ProductStats flow
- `totalOrders` increments on CONFIRM (first hit) via `POST /internal/products/{id}/post-order`
- `totalReviews` increments only when rating is submitted (second hit, request contains `rating` field)
- `avgRating` recalculated when rating is submitted

## Jastiper profile enrichment (inventory → auth)
- `ProductServiceImpl.enrichProductResponse()` and `AdminProductServiceImpl.enrichProductResponse()` call `GET /profile/id/{id}` on auth service
- Auth response fields: `username`, `full_name`, `profile_picture_url`, `rating` (top-level double), `stats.total_orders` (nested)
- `JastiperInfo.avgRating` ← `data.rating` (NOT `data.avg_rating`)
- `JastiperInfo.totalOrders` ← `data.stats.total_orders`

## Success rate
- Auth service computes `success_rate = (completedOrders / totalOrders) * 100`, returns 0–100 range
- Frontend displays directly without multiplying by 100
