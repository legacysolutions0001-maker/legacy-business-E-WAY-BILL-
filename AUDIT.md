# Legacy Business E-Way Bill — Audit Report
**Date:** 2026-06-15
**Auditor:** Replit Agent

---

## 1. Architecture Overview

| Layer | Technology |
|---|---|
| Backend | Express 5, TypeScript, pnpm monorepo |
| Database | PostgreSQL + Drizzle ORM |
| Auth | express-session (cookie-based, server-side sessions) |
| Frontend | React + Vite |
| Deployment | Render (single service) |

---

## 2. Auth & Roles

| Role | Access |
|---|---|
| `super_admin` | Full access — all companies, all e-way bills, stats |
| `company_user` | Company-scoped — own bills only |

**Auth flow:**
- `POST /api/auth/login` — session login with `companyCode + username + password`
- Session stored server-side, cookie is `httpOnly + secure` in production

**Default credentials (auto-seeded on startup):**
- Super admin: `username=bhullar01` / `password=Bhullar_01` / `companyCode=bhullar`
- ⚠️ **Change password after first deployment.**

---

## 3. Environment Variables Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Session signing secret — must be long and random |
| `PORT` | Server port (Render sets this to `10000`) |
| `NODE_ENV` | `production` or `development` |

---

## 4. Bugs Fixed (this audit)

### BUG-001: Inline `requireAuth` / `requireSuperAdmin` duplicated across 3 route files
- **Files:** `routes/ewaybills.ts`, `routes/stats.ts`, `routes/users.ts`
- **Severity:** Medium
- **Problem:** Each route file independently defined its own copy of the auth middleware using `req: any`, bypassing TypeScript safety. Any security change needed to be applied in 3 places.
- **Fix:** Created `src/middlewares/auth.ts` with properly typed shared implementations. All 3 route files now import from it.

---

## 5. Observations

- ✅ Startup runs migrations via raw SQL `IF NOT EXISTS` — idempotent and safe
- ✅ `DATABASE_URL` and `SESSION_SECRET` validated at startup
- ✅ Passwords hashed with `bcryptjs` (10 rounds)
- ℹ️ `cors({ origin: true })` accepts any origin — fine for internal tool, review if exposed publicly
- ⚠️ `DELETE /ewaybills/:id` uses `requireAuth` but does not check company ownership — a `company_user` can delete any bill by ID. Consider adding ownership check or switching to `requireSuperAdmin`.

---

## 6. Deployment (Render)

```
Build: corepack enable && pnpm install && pnpm --filter @workspace/eway-bill run build && pnpm --filter @workspace/api-server run build
Start: node --enable-source-maps artifacts/api-server/dist/index.mjs
Port:  10000
Health: /api/healthz
```

---

## 7. First-Run Checklist

- [ ] Deploy — auto-runs migrations and seeds `bhullar01` / `Bhullar_01`
- [ ] Login at `/api/auth/login` with `companyCode=bhullar`, `username=bhullar01`, `password=Bhullar_01`
- [ ] Change super admin password immediately
- [ ] Create company records before creating company users
