# Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # BFF route handlers (server-side only)
│   │   └── auth/
│   │       ├── login/          # POST /api/auth/login — proxies to backend, sets refresh_token cookie
│   │       ├── logout/         # POST /api/auth/logout
│   │       └── refresh-token/  # POST /api/auth/refresh-token — rotates refresh_token cookie
│   ├── login/                  # /login page
│   ├── register/               # /register page
│   ├── wallet/                 # /wallet page
│   ├── layout.tsx              # Root layout — mounts <AuthProvider>
│   ├── page.tsx                # Home / product catalog
│   └── globals.css             # Tailwind import + CSS custom properties
│
└── lib/
    ├── auth.ts                 # Server-side JWT helpers (verifyJwt, isAdmin, isJastiper, isTitipers)
    ├── auth/
    │   └── AuthProvider.tsx    # Client context: accessToken, setAccessToken, clearAuth
    └── api/
        ├── client.ts           # Core fetch utilities and ApiError class
        ├── useAuthorizedFetch.ts  # Hook: auto-attaches Bearer token, retries on 401 with refresh
        ├── index.ts            # Re-exports everything
        ├── auth.ts             # Facade re-export (backward compat)
        ├── auth/               # Auth domain modules
        │   ├── auth-core.ts    # login, register, refreshToken, logout
        │   ├── profile.ts      # getMyProfile, updateMyProfile, getPublicProfile
        │   ├── kyc.ts          # KYC submission
        │   ├── admin-kyc.ts    # Admin KYC review
        │   ├── admin-users.ts  # Admin user management
        │   └── index.ts        # Re-exports all auth modules
        ├── payment/            # Payment domain modules
        │   ├── wallet.ts       # getMyWallet, getWalletTransactions, getWalletTransactionById
        │   ├── topup.ts        # createTopUpTransaction, confirmTopUpTransaction
        │   ├── withdrawal.ts   # createWithdrawal, processWithdrawal
        │   ├── admin.ts        # Admin wallet operations
        │   └── index.ts        # paymentApi object + re-exports
        ├── inventory.ts        # Inventory API calls
        └── orders.ts           # Orders API calls
```

## Key Conventions

### API Layer (`src/lib/api/`)
- `apiFetchFrom(service, endpoint, options)` — base fetch, selects base URL by service name (`auth | payment | inventory | orders`)
- Convenience wrappers: `authFetch`, `paymentFetch`, `inventoryFetch`, `ordersFetch`
- `appFetch` — for internal Next.js BFF routes (uses `credentials: 'include'`, no service base URL)
- All fetch helpers throw `ApiError` (with `.status` and `.body`) on non-2xx responses
- Use `isApiError(error)` to narrow caught errors before reading `.status` / `.body`
- Domain modules are grouped by service in subdirectories; each exports typed request/response types alongside the function

### Auth Flow
- Login → BFF `/api/auth/login` → sets `refresh_token` HttpOnly cookie, returns `access_token` in body
- `access_token` stored in `AuthProvider` React context (in-memory only)
- `useAuthorizedFetch` hook handles attaching `Authorization: Bearer` header and transparent token refresh on 401
- Middleware (`middleware.ts`) guards `/admin/*` routes using `verifyJwt` + `isAdmin`

### Pages & Components
- Client components require `'use client'` directive at the top
- Forms use the `action={asyncHandler}` pattern (React 19 form actions) — not `onSubmit`
- Loading/submitting state tracked with `useState<boolean>`
- API errors caught and displayed inline; use `role="alert"` on error elements

### Naming & Types
- Response types are co-located with their fetch function in the same file
- Type names follow the pattern: `<Action><Domain><Outcome>Response` (e.g., `CreateTopUpTransactionSuccessResponse`)
- Use `string | number` for IDs returned from the backend (backend may return either)
- Monetary amounts are plain `number` (IDR, no decimals in practice)
