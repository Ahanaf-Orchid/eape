# Project Status

**Last updated:** 2026-06-12

## Overview
Ethereum Apes — a Next.js referral and rewards platform.
**Phase 17 complete** — Campaign final-submit batch API + frontend-only per-task UX.

## Pages

| Page | Status | Layers | Notes |
|------|--------|--------|-------|
| `/` (Home) | Working | 1+2 | Atomic registration, images wired, banner rotation, refresh button, no public user reads |
| `/campaign` | Working | 1+2+3 | Frontend-only per-task UX + batch final-submit, daily reward card |
| `/checknfts` | Working | 1+2 | Images + sale phases wired from config, banner rotation, no public user reads |
| `/contact` | Working | 1 | Public contact form → admin inbox |
| `/connectadmin` | Working | 3 | Admin dashboard — auth stats + nav |
| `/connectadmin/home` | Working | 3 | Frontend/Backend tabs, token-based auth |
| `/connectadmin/verify` | Working | 3 | Batch verify, token-based auth, dual-field sync |
| `/connectadmin/campaign` | Working | 3 | Campaign editor, token-based auth |
| `/connectadmin/holders` | Working | 3 | User management, MXP adjustment with confirmation + audit trail |
| `/connectadmin/images` | Working | 3 | Upload + 2-col grid, click-to-upload, token-based auth |
| `/connectadmin/contacts` | Working | 3 | Admin contact inbox, reply/close/delete |
| `/partnership` | Deleted | — | Replaced by `/contact` |
| `/invest-early` | Deleted | — | Replaced by `/contact` |
| `/api/submit/[type]` | Deleted | — | Migrated to `/api/form/*` |

## Phase Status

| Phase | Status |
|-------|--------|
| 11: 3-Layer Architecture Restructuring | Done |
| 12: Contact System + Cleanup | Done |
| 13: Image Manager v2 + Wiring | Done |
| 14: Data Audit & Fixes | Done |
| 15E: Production API Cleanup + Docs Sync | Done |
| 16: Daily Reward + Remove PAGE UNAVAILABLE | Done |
| 17: Campaign Final Submit Batch API | Done |

## Database

- **Engine**: SQLite via `better-sqlite3` (WAL mode)
- **Location**: `data/eape.db` (local) → Docker volume (production)
- **Tables**: 12 (config, users, usernames, wallets, sol_wallets, device_submissions, referral_events, device_logins, contacts, invest_early, admin_audit_log)

## Endpoints

| Endpoint | Type | Auth | Purpose |
|----------|------|------|---------|
| `GET /api/config/public` | Public | No | Layer 2 config (homepage, campaign, images, checknfts) |
| `GET /api/leaderboard` | Public | No | Sanitized leaderboard: rank, username, value only |
| `POST /api/user/register` | Public | No | Atomic user registration (rate limited: 5/min) |
| `GET /api/user/lookup` | Public | No | Lookup user by username — public data only (rate limited: 60/min) |
| `POST /api/campaign/complete-task` | Public | No | Task completion (rate limited: 10/min) |
| `POST /api/campaign/claim-daily-reward` | Public | No | Claim daily reward (rate limited: 5/min) |
| `POST /api/campaign/final-submit` | Public | No | Batch task completion (rate limited: 10/min) |
| `POST /api/form/contact` | Public | No | Contact form submission (rate limited: 5/min) |
| `POST /api/admin/login` | Admin | No | Login, returns session token (rate limited: 5/min) |
| `GET /api/admin/config` | Admin | Bearer | Read config |
| `POST /api/admin/config` | Admin | Bearer | Write config (merge or replace) |
| `POST /api/admin/config/update` | Admin | Bearer | Update config block |
| `POST /api/admin/campaign/save` | Admin | Bearer | Save campaign config |
| `GET /api/admin/users` | Admin | Bearer | Paginated user list |
| `POST /api/admin/users/update` | Admin | Bearer | Update user + audit log + field sync (rate limited: 30/min) |
| `POST /api/admin/users/verify` | Admin | Bearer | Bulk verify/disqualify |
| `GET /api/admin/stats` | Admin | Bearer | Dashboard stats |
| `POST /api/admin/upload` | Admin | Bearer | File upload to public/uploads/ |
| `DELETE /api/admin/upload` | Admin | Bearer | Delete uploaded file |
| `GET /api/admin/contacts` | Admin | Bearer | List contact messages |
| `POST /api/admin/contacts/update` | Admin | Bearer | Close/delete contact messages |
| `* /api/data/[path]` | Locked | — | Returns 410 Gone — all functionality moved to dedicated endpoints |

## Security

- Admin auth: Server-side session tokens (4hr TTL, in-memory Map)
- Admin endpoints: All protected with `requireAdmin()` Bearer token validation
- Public endpoints: Rate limited (register 5/min, lookup 60/min, contact 5/min, complete-task 10/min, login 5/min)
- Audit trail: All MXP changes logged to `admin_audit_log` table (old/new values + admin email)
- MXP validation: Max ±10K per adjustment, max 1M total
- Deprecated `/api/data/[path]`: Returns 410 Gone
- Session key: `eape_admin_session` (localStorage)
- On 401: Auto-clears session + dispatches `admin-unauthorized` event
- No public all-user reads: leaderboard returns sanitized data, lookup returns single-user public fields only

## Known Issues

- `public/shared/` needs SVG files (icon-top-1/2/3, thumb-1-5, mint-logo) — image manager works around this
- `gxp` legacy field still referenced in 16 fallbacks across 4 files
- Stale `.mint-*` CSS (~800 lines) still in globals.css
- Admin sessions live in-memory (server restart = all logged out)
- `verificationStatus` ↔ `reviewStatus` dual-field now synced on write, but old data may be stale
