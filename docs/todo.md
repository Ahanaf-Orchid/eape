# Todo List

**Last updated:** 2026-06-12

## Done — Phase 11: 3-Layer Architecture

- [x] ARCHITECTURE.md — full 3-layer spec
- [x] All dedicated API endpoints (17 endpoints)
- [x] `admin-auth.ts` + `rate-limit.ts`
- [x] `site-config.ts` expanded (~501 lines)
- [x] Atomic registration on homepage + checknfts
- [x] Admin panel rebuilt (7 pages, token-based auth)
- [x] Image manager v2 with file upload + 2-col grid
- [x] Images wired to all pages (brandImages, homeImages, balanceIcons, checknfts)
- [x] Banner rotation (homeImages + homeDurations)
- [x] Mobile profile card CSS fix
- [x] HomeButtons wiring from admin config
- [x] Logo corners squared, pre-login vertical centering

## Done — Phase 12: Contact System + Cleanup

- [x] `/contact` page (replaces `/partnership`)
- [x] `POST /api/form/contact` endpoint
- [x] `/connectadmin/contacts` admin inbox
- [x] `GET /api/admin/contacts` + `POST /api/admin/contacts/update`
- [x] `contacts` table in db.ts
- [x] Deleted `/partnership` page + `/api/submit/[type]`
- [x] Renamed `verification-pending-michy` → `verification-pending-banner`
- [x] Removed `.michy-hero-text` CSS
- [x] Deleted `data/michy.db*` files
- [x] Git init + first commit

## Done — Phase 14: Data Audit & Fixes

- [x] Verification field sync (`reviewStatus` ↔ `verificationStatus` on write)
- [x] `normalizeReviewStatus` / `getReviewStatus` handles both fields
- [x] `admin_audit_log` table for MXP change tracking
- [x] MXP adjustment validation (max ±10K, max 1M, rate limited)
- [x] Holders page confirmation dialog
- [x] Campaign page rewrote: `userApi.lookup/completeTask`, no deprecated APIs
- [x] `GET /api/user/lookup` endpoint
- [x] `invest-early` migrated from `api.submit()` to `formApi.investEarly()`
- [x] Refresh button (🔄/⏳) on homepage + checknfts (30s cooldown)
- [x] Rename `xpLabel: "EXP"` → `xpLabel: "MXP"` — unified naming
- [x] GitHub repo created + pushed (`Ahanaf-Orchid/eape`)
- [x] Login flow replaced: `api.get("users")` → `userApi.lookup()` — no more downloading all users
- [x] Upload volume mount + auto-delete old files on replace
- [x] Deployed to Hostinger KVM 4 — Docker + nginx + SSL — https://ethereumapes.com

## Done — Phase 15E: Production API Cleanup + Docs Sync

- [x] Removed `loadCache()` bulk user download from page.tsx + checknfts/page.tsx
- [x] Replaced leaderboard `api.get("users")` with `GET /api/leaderboard`
- [x] Created sanitized `/api/leaderboard` endpoint (rank, username, value only)
- [x] Removed `formApi.partnership` and `formApi.investEarly` from api.ts
- [x] Removed deprecated `api.submit` from api.ts
- [x] Removed `cachedUsers` state and all references from both public pages
- [x] Removed `api` import from page.tsx and checknfts/page.tsx
- [x] `api.get("users")` → 0 calls remaining in source
- [x] Added rate limits: `/api/user/lookup` (60/min), `/api/form/contact` (5/min), `/api/admin/login` (5/min), `/api/config/public` (120/min), `/api/leaderboard` (60/min)
- [x] Locked `/api/data/[path]` to 410 Gone
- [x] Admin routes verified: all use `requireAdmin()` except login
- [x] Added `publicApi.leaderboard()` helper
- [x] Contact form validation improved (honeypot, email format, length checks)
- [x] Removed dead `partnershipSubmit` / `investEarlySubmit` from db.ts
- [x] Build passes (0 TypeScript errors)
- [x] Docs fully cleaned of stale references

## Done — Phase 16: Daily Reward + Remove PAGE UNAVAILABLE

- [x] Removed "PAGE UNAVAILABLE" system from campaign page (pageAvailable, pageRuntime, toggle)
- [x] Removed `pageRuntime` from PUBLIC_CONFIG_PATHS
- [x] Removed `pageAvailability` section from admin home page
- [x] Added `daily_claims` table with UNIQUE(userId, rewardDate, rewardType)
- [x] Added `dailyClaimCheck` / `dailyClaimCreate` helpers to db.ts
- [x] Created `POST /api/campaign/claim-daily-reward` (rate limited: 5/min)
- [x] Added `dailyRewardEnabled` + `dailyRewardMxp` to admin campaign editor
- [x] Added daily reward UI card to campaign page — visible whether tasks exist or not
- [x] Reward amount comes from admin config (default: 20 MXP)
- [x] One claim per user per day enforced by UNIQUE constraint
- [x] Campaign page always loads — never shows "PAGE UNAVAILABLE"
- [x] Build passes (0 TypeScript errors, 32 routes)

## Done — Phase 17: Campaign Final Submit Batch API

- [x] Created `POST /api/campaign/final-submit` — batch task completion (rate limited: 10/min)
- [x] Per-task "SUBMIT" buttons changed to frontend-only "MARK READY"
- [x] Added "COMPLETE TASKS" final button — sends all pending tasks in one API call
- [x] Backend validates: user exists, task exists, task active, not duplicate, proof required
- [x] Reward MXP computed from backend config (`task.points`) — never trusts frontend
- [x] Fixed: handles real campaign config object structure (not array)
- [x] Deduplicates same taskId within single request
- [x] Added `userApi.finalSubmit()` to api.ts client
- [x] Daily reward system unchanged (separate API, once-per-day)
- [x] `complete-task` endpoint kept for backward compat
- [x] Build passes (0 TypeScript errors, 33 routes)

## Pending

- [ ] gxp legacy cleanup (16 references in 4 files — `|| user.gxp || 0` fallbacks)
- [ ] Remove stale `.mint-*` CSS (~800 lines in globals.css)
- [ ] Persist admin sessions to SQLite (survives server restart)
- [ ] Merge `page.tsx` and `checknfts/page.tsx` into shared component
- [ ] Wire `walletConnect` Solana/EVM toggles to actual wallet modal logic
- [ ] Config auto-refresh on tab focus (version check, no polling)
- [ ] Populate `public/shared/` with SVG files
- [ ] Post-deploy monitoring setup (UptimeRobot)
