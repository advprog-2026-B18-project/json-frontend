# Tech Stack

## Framework & Runtime
- **Next.js 16** (App Router) with **React 19**
- **TypeScript 5** — strict mode enabled
- Target: ES2017, module resolution: `bundler`
- Path alias: `@/*` → `src/*`

## Styling
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- CSS custom properties defined in `src/app/globals.css`:
  - `--color-primary-dark`: `#237227`
  - `--color-primary`: `#519A66`
  - `--color-secondary`: `#FFAA00`
  - `--color-secondary-light`: `#FFD786`
- - Use `(--color-primary)` syntax when referencing CSS vars inside Tailwind utility classes, e.g. `from-(--color-primary)`
- Fonts: Geist Sans + Geist Mono (Google Fonts, loaded via `next/font`)

## Auth & Security
- **jose** — JWT verification on the server/middleware side
- JWT algorithm: HS256, secret from `JWT_SECRET` env var
- Refresh token stored as `HttpOnly` cookie (`refresh_token`)
- Access token held in React context (`AuthProvider`) — never persisted to storage

## Key Libraries
| Package | Purpose |
|---|---|
| `next` | Framework, routing, API routes, middleware |
| `react` / `react-dom` | UI |
| `jose` | JWT verification (server-side / middleware) |
| `tailwindcss` | Utility-first CSS |
| `eslint` + `eslint-config-next` | Linting |

## Environment Variables
| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_AUTH_SERVICE_URL` | Auth service base URL (`http://localhost:8082`) |
| `NEXT_PUBLIC_PAYMENT_SERVICE_URL` | Payment service base URL (`http://localhost:8081`) |
| `NEXT_PUBLIC_INVENTORY_SERVICE_URL` | Inventory service base URL (`http://localhost:8083`) |
| `NEXT_PUBLIC_ORDER_SERVICE_URL` | Orders service base URL (`http://localhost:8084`) |
| `JWT_SECRET` | Server-side JWT verification (not public) |

## Common Commands
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

> Note: The backend is a separate service expected at the URLs above.
> 
> **Proxy architecture:**
> - **Client-side** requests use Next.js rewrites (`/api/auth/*`, `/api/inventory/*`, etc.) defined in `next.config.ts`, proxying to the backend services. This avoids CORS issues from the browser.
> - **Server-side** (SSR) requests go directly to the backend URLs from env vars.
> - Auth operations (login/logout/refresh) use Next.js BFF route handlers (`/api/auth/*`) to manage the HttpOnly refresh_token cookie server-side.
