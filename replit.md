# Legacy Business E-WAY BILL Generator

A multi-company E-Way Bill management system for Indian GST compliance. Super admins manage companies and users; company users generate, view, download, and print E-Way Bills in PDF format.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/eway-bill run dev` — run the frontend (port 20540)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session signing secret (already set)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (wouter routing, TanStack Query)
- API: Express 5 + express-session
- DB: PostgreSQL + Drizzle ORM
- Auth: Session-based (bcryptjs password hashing)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle DB schema (companies, users, ewaybills)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, companies, users, ewaybills, stats)
- `artifacts/eway-bill/src/` — React frontend

## Architecture decisions

- Session-based auth (not JWT): simpler for multi-company portal, sessions stored server-side.
- Super admin belongs to their own company (code: `bhullar`) with role `super_admin`.
- Company users belong to their company; E-Way Bill access is scoped to their companyId.
- bcryptjs (pure JS) instead of native bcrypt to avoid native compilation issues in Replit.
- EWB numbers are 12-digit system-generated numbers (timestamp + random).
- Validity is computed as 1 day per 200 km distance entered.

## Product

- **Login**: Company Code + Username + Password. Super Admin login hint at the bottom.
- **Super Admin Dashboard**: Total companies, users, E-Way Bills; recent bills across all companies.
- **Companies** (super admin): Add, edit, activate/deactivate companies.
- **Users** (super admin): Add users, assign to companies, set roles.
- **E-Way Bills**: Full GST-compliant generation form (Part A + Part B), save, list, view, print/download PDF.

## Super Admin Credentials

- Company Code: `bhullar`
- Username: `bhullar01`
- Password: `Bhullar_01`

## User preferences

- App name: "Legacy Business E-WAY BILL Generator"

## Gotchas

- After schema changes, run `pnpm --filter @workspace/db run push` then restart the API server.
- After OpenAPI spec changes, run `pnpm --filter @workspace/api-spec run codegen`.
- bcrypt build scripts are ignored by pnpm — use bcryptjs instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
