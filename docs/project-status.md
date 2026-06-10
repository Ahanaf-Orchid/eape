# Project Status

**Last updated:** 2026-06-10

## Overview
Ethereum Apes — a Next.js referral and rewards platform.
**Phase 11 complete** — 3-Layer Architecture Restructured.

## Pages

| Page | Status | Layers | Notes |
|------|--------|--------|-------|
| `/` (Home) | Working | 1+2 | Atomic registration, images wired, banner rotation |
| `/campaign` | Working | 1+2 | Dedicated complete-task endpoint |
| `/checknfts` | Working | 1+2 | Images + sale phases wired from config, banner rotation |
| `/partnership` | Working | 1 | Dedicated `/api/form/partnership` |
| `/invest-early` | Working | 1 | Dedicated `/api/form/invest-early` |
| `/connectadmin` | Working | 3 | Admin dashboard — auth stats + nav |
| `/connectadmin/home` | Work | 3 | Frontend/Backend tabs, token-based auth |
| `/connectadmin/verify` | Working | 3 | Batch verify, token-based auth |
| `/connectadmin/campaign` | Working | 3 | Campaign editor, token-based auth |
| `/connectadmin/holders` | Working | 3 | User management, token-based auth |
| `/connectadmin/images` | Working | 3 | Upload + 2-col grid, token-based auth |
| `/connectadmin/mode` | Deleted | — | Dead stub removed |

## Phase 11 Status

| Phase | Status |
|-------|--------|
| 11A: Architecture Documentation | Done |
| 11B: Split Generic API into Dedicated Endpoints | Done |
| 11C: Move Layer 2 Defaults into site-config.ts | Done |
| 11D: Fix Multi-Step Registration (Atomic) | Done |
| 11E: Auth Guards + Rate Limiting | Done |
| 11F: Merge Duplicate Pages (checknfts) | Done |
| 11G: Admin Panel Rebuild + Image Manager | Done |
| 11H: Image Wiring + Mobile CSS + Banner Rotation | Done |
| 11I: HomeButtons Wiring | Done |

## Database

- **Engine**: SQLite via `better-sqlite3` (WAL mode)
- **Location**: `data/eape.db` (local) → Docker volume (production)
- **Tables**: 10 (config, users, usernames, wallets, sol_wallets, device_submissions, referral_events, device_logins, partnerships, invest_early)
- **API**: Dedicated endpoints with `requireAdmin()` auth

## Hosting

- **Provider**: Hostinger KVM 4 (4 CPU, 16GB RAM, 200GB SSD, 16TB bandwidth)
- **Deployment**: GitHub (private org repo) → Docker Compose (app + nginx)
- **SSL**: Let's Encrypt via nginx

## Security

- Admin auth: Server-side session tokens (4hr TTL, in-memory Map)
- Admin endpoints: All protected with `requireAdmin()` Bearer token validation
- Public endpoints: Rate limited (5/min register, 10/min complete-task)
- Deprecated `/api/data/[path]`: Still serves public reads, admin writes blocked
- Session key: `eape_admin_session` (localStorage)

## Known Issues

- `public/shared/` needs 9 SVG files (icon-top-1/2/3, thumb-1-5, mint-logo)
- `public/uploads/` needs write permission in production
- Old `/api/submit/[type]` still exists (to be removed)
- `generateMetadata` does one SQLite read per page (acceptable for now)
