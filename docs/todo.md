# Todo List

**Last updated:** 2026-06-10

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

## Pending

- [ ] gxp legacy cleanup (16 references in 4 files — `|| user.gxp || 0` fallbacks)
- [ ] Remove stale `.mint-*` CSS (~800 lines in globals.css)
- [ ] Delete unused `/api/form/partnership` endpoint
- [ ] `page.tsx` + `checknfts/page.tsx` — replace remaining `api.get("users")` calls (~12 each)
- [ ] Persist admin sessions to SQLite (survives server restart)
- [ ] Merge `page.tsx` and `checknfts/page.tsx` into shared component
- [ ] Wire `walletConnect` Solana/EVM toggles to actual wallet modal logic
- [ ] Config auto-refresh on tab focus (version check, no polling)
- [ ] Populate `public/shared/` with SVG files
- [ ] Create GitHub remote repo + push
- [ ] Deploy to Hostinger KVM 4 via Docker Compose
- [ ] Post-deploy verification
