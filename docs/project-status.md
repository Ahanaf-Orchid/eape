# Project Status

**Last updated:** 2026-06-10

## Overview
Ethereum Apes — a Next.js referral and rewards platform.
**Phase 14 complete** — Data Audit, Verification Fix, Campaign Rewrite, Refresh Button.

## Pages

| Page | Status | Layers | Notes |
|------|--------|--------|-------|
| `/` (Home) | Working | 1+2 | Atomic registration, images wired, banner rotation, refresh button |
| `/campaign` | Working | 1+2+3 | Rewritten: `userApi.lookup/completeTask`, no deprecated APIs |
| `/checknfts` | Working | 1+2 | Images + sale phases wired from config, banner rotation, refresh button |
| `/contact` | Working | 1 | Public contact form → admin inbox |
| `/invest-early` | Working | 1 | Dedicated `/api/form/invest-early` (migrated from deprecated submit) |
| `/connectadmin` | Working | 3 | Admin dashboard — auth stats + nav |
| `/connectadmin/home` | Working | 3 | Frontend/Backend tabs, token-based auth |
| `/connectadmin/verify` | Working | 3 | Batch verify, token-based auth, dual-field sync |
| `/connectadmin/campaign` | Working | 3 | Campaign editor, token-based auth |
| `/connectadmin/holders` | Working | 3 | User management, MXP adjustment with confirmation + audit trail |
| `/connectadmin/images` | Working | 3 | Upload + 2-col grid, click-to-upload, token-based auth |
| `/connectadmin/contacts` | Working | 3 | Admin contact inbox, reply/close/delete |
| `/connectadmin/mode` | Deleted | — | Dead stub removed |
| `/partnership` | Deleted | — | Replaced by `/contact` |
| `/api/submit/[type]` | Deleted | — | Migrated to `/api/form/*` |

## Phase Status

| Phase | Status |
|-------|--------|
| 11: 3-Layer Architecture Restructuring | Done |
| 12: Contact System + Cleanup | Done |
| 13: Image Manager v2 + Wiring | Done |
| 14A: Verification Field Unification | Done |
| 14B: gxp Legacy Cleanup | Pending |
| 14C: Deprecated API Removal | Done (invest-early) |
| 14D: Refresh Button | Done |

## Database

- **Engine**: SQLite via `better-sqlite3` (WAL mode)
- **Location**: `data/eape.db` (local) → Docker volume (production)
- **Tables**: 12 (config, users, usernames, wallets, sol_wallets, device_submissions, referral_events, device_logins, partnerships, contacts, invest_early, admin_audit_log)
- **API**: Dedicated endpoints with `requireAdmin()` auth

## Endpoints

| Endpoint | Type | Auth | Purpose |
|----------|------|------|---------|
| `GET /api/config/public` | Public | No | Layer 2 config (homepage, campaign, images, checknfts) |
| `POST /api/user/register` | Public | No | Atomic user registration |
| `GET /api/user/lookup` | Public | No | Lookup user by username (public data only) |
| `POST /api/campaign/complete-task` | Public | No | Task completion (rate limited) |
| `POST /api/form/contact` | Public | No | Contact form submission |
| `POST /api/form/invest-early` | Public | No | Invest-early form submission |
| `POST /api/admin/login` | Admin | No | Login, returns session token |
| `GET /api/admin/config` | Admin | Bearer | Read config |
| `POST /api/admin/config` | Admin | Bearer | Write config (merge or replace) |
| `POST /api/admin/campaign/save` | Admin | Bearer | Save campaign config |
| `GET /api/admin/users` | Admin | Bearer | Paginated user list |
| `POST /api/admin/users/update` | Admin | Bearer | Update user + audit log + field sync |
| `POST /api/admin/users/verify` | Admin | Bearer | Bulk verify/disqualify |
| `GET /api/admin/stats` | Admin | Bearer | Dashboard stats |
| `POST /api/admin/upload` | Admin | Bearer | File upload to public/uploads/ |
| `GET /api/admin/contacts` | Admin | Bearer | List contact messages |
| `POST /api/admin/contacts/update` | Admin | Bearer | Close/delete contact messages |
| `GET /api/data/[path]` | Deprecated | None | Legacy catch-all (X-Deprecated header) |

## Hosting

- **Provider**: Hostinger KVM 4 (4 CPU, 16GB RAM, 200GB SSD, 16TB bandwidth)
- **Deployment**: GitHub (private org repo) → Docker Compose (app + nginx)
- **SSL**: Let's Encrypt via nginx

## Security

- Admin auth: Server-side session tokens (4hr TTL, in-memory Map)
- Admin endpoints: All protected with `requireAdmin()` Bearer token validation
- Public endpoints: Rate limited (5/min register, 10/min complete-task, 30/min admin-update)
- Audit trail: All MXP changes logged to `admin_audit_log` table (old/new values + admin email)
- MXP validation: Max ±10K per adjustment, max 1M total
- Deprecated `/api/data/[path]`: Still serves public reads, admin writes blocked
- Session key: `eape_admin_session` (localStorage)
- On 401: Auto-clears session + dispatches `admin-unauthorized` event

## Known Issues

- `public/shared/` needs SVG files (icon-top-1/2/3, thumb-1-5, mint-logo) — image manager works around this
- `page.tsx` and `checknfts/page.tsx` still use ~12 deprecated `api.get("users")` calls each for lookups
- `gxp` legacy field still referenced in 16 fallbacks across 4 files
- Stale `.mint-*` CSS (~800 lines) still in globals.css
- Admin sessions live in-memory (server restart = all logged out)
- `verificationStatus` ↔ `reviewStatus` dual-field now synced on write, but old data may be stale
- `generateMetadata` does one SQLite read per uncached page render (acceptable)
