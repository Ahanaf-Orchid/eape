# Decision Log

**Last updated:** 2026-06-10

**Important:** For the canonical current-truth reference, start with: **docs/ARCHITECTURE.md**

This file preserves historical decisions. For what is currently live, see the architecture doc.

---

## Phase 11: 3-Layer Architecture Restructuring

**Date:** 2026-06-10

**Decision:** Restructure the platform into a strict 3-layer architecture:
- Layer 1: Hardcoded Frontend UI (instant render, no backend calls)
- Layer 2: Editable Public Config (fetched once on page load, admin-editable)
- Layer 3: Backend Validated Data (server-side auth, validation, storage)

**Reason:**
- Current generic `/api/data/[path]` catch-all has zero auth — anyone can read/write all data
- Frontend currently computes rewards instead of backend
- Multi-step registration makes 7+ API calls instead of 1 atomic call
- Layer 2 defaults (task URLs, labels, QT templates) scattered across files
- `page.tsx` and `checknfts/page.tsx` are near-duplicates (maintenance burden)

**Sub-decisions:**

### 11A: Architecture Documentation
- Write `docs/ARCHITECTURE.md` as canonical reference
- All decisions flow from this document

### 11B: Split Generic API
- Replace `/api/data/[path]` with dedicated endpoints:
  - `GET /api/config/public` — Layer 2
  - `POST /api/user/register` — Layer 3
  - `POST /api/campaign/complete-task` — Layer 3
  - `POST /api/admin/config/update` — Admin (authenticated)
  - `POST /api/admin/campaign/save` — Admin (authenticated)
  - `POST /api/admin/users/verify` — Admin (authenticated)
  - `GET /api/admin/users` — Admin, paginated
  - `GET /api/admin/stats` — Admin
  - `POST /api/form/partnership` — Form
  - `POST /api/form/invest-early` — Form
- Keep old catch-all for backward compat with deprecation notice

### 11C: Layer 2 Defaults Centralization
- Move all default task config, QT templates, status names/levels, step titles, button labels, balance labels, banner path, campaign defaults, mxpRewards into `site-config.ts`
- Merge `nft-config.ts` into `site-config.ts`

### 11D: Fix Multi-Step Registration
- Collect all user data locally → ONE `POST /api/user/register` call
- Backend validates everything atomically
- Structured errors with `{ step, field, message }` — frontend navigates to failed step

### 11E: Auth Guards
- All `/api/admin/*` endpoints validate admin session on every request
- Rate limiting on registration and task completion

### 11F: Merge Duplicate Pages
- Merge `page.tsx` and `checknfts/page.tsx` into shared component

### 11G: Security Hardening
- Remove generic user list endpoint
- Fix `gippo_admin_session` key
- Add security headers

---

## Phase 10: UI Polish + Private Git + Production Deploy

**Date:** 2026-06-10

**Decision:** Rebrand "Michy the Cat" → "Ethereum Apes" via local compile-time constants (`src/lib/site-config.ts`), then polish UI and deploy.

**Sub-decisions:**
- Brand names become local compile-time constants, not backend-fetched
- Single `site-config.ts` file controls all brand strings
- Twitter/Telegram URLs come from site-config (but are also admin-editable as Layer 2)
- DB filename changed from `michy.db` to `eape.db`

---

## Phase 9: Firebase → SQLite Migration + VPS Deployment

**Date:** 2026-06-10

**Decision:** Replace Firebase Realtime Database with SQLite and deploy to Hostinger KVM 4 VPS.

**Reason:**
- Moving off Firebase entirely (both database and hosting)
- Self-hosted data on VPS for full control and no vendor lock-in
- SQLite chosen for zero-setup, single-server simplicity
- Next.js API Routes for single deploy unit

**Implementation:**
- 9A: Deleted buy/mint pages + all cross-references
- 9B: `better-sqlite3` with 10-table schema, WAL mode
- 9C: Unified API route (`/api/data/[path]`) + submission route
- 9D: All 11 pages rewired from Firebase SDK to `api.ts`
- 9E: Admin auth moved to server-side `/api/admin/login`
- 9F: Firebase → SQLite migration script
- 9G: Dockerfile + docker-compose.yml + nginx.conf
- 9H: Firebase npm removed, build passes clean

---

## Phase 8: Campaign Hybrid Cleanup

**Date:** 2026-04-02

**Decision:** Document campaign as intentional live-activity feature.

---

## Phase 7: Startup Overlay

**Date:** 2026-04-02

**Decision:** Add startup overlay to homepage for smoother initial boot.

---

## Phase 6F: Balance Label Wiring

**Date:** 2026-04-02

**Decision:** Wire balance-label settings from HOME into live public homepage.

---

## Phase 6E2: Legacy Cleanup Finish

**Date:** 2026-04-02

**Decision:** Remove final remaining LIVE fallback from HOME normalizeConnectBehavior.

---

## Phase 6E: Legacy Key Cleanup

**Date:** 2026-04-02

**Decision:** Remove legacy fallback paths, canonical keys now stable.

---

## Phase 6C3: Homepage Step-5 and HOME URL Editor Final Alignment

**Date:** 2026-04-02

**Decision:** Fix remaining homepage trust gaps.

---

## Phase 6C2: Homepage Task Mapping Alignment

**Date:** 2026-04-02

**Decision:** Fix task key normalization so HOME edits control live homepage.

---

## Phase 6C: Homepage Task/Status/Referral Source-of-Truth Unification

**Date:** 2026-04-02

**Decision:** Unify config under `config/homepage` with HOME as real editor.

---

## Phase 6B2E: Legacy Mode Cleanup Complete

**Date:** 2026-04-02

**Decision:** Remove legacy mode/modeVisible compatibility layer.

---

## Phase 6B2D: User-Facing Wording Cleanup

**Date:** 2026-04-02

**Decision:** User-facing wording describes actual behavior, not abstract Mode names.

---

## Phase 6B2C: MODE Compatibility Page Cleanup

**Date:** 2026-04-02

**Decision:** MODE page becomes transitional compatibility page.

---

## Phase 6B2B: HOME Admin Canonical Writer

**Date:** 2026-04-02

**Decision:** HOME becomes canonical admin writer for homepage connect behavior.

---

## Phase 6B2A: Canonical Connect Behavior Keys

**Date:** 2026-04-02

**Decision:** Replace abstract Mode with explicit connect behavior controls.

---

## Phase 6A: Homepage Admin Foundation

**Date:** 2026-04-02

**Decision:** HOME becomes primary homepage admin foundation.

---

## Why We Removed Firebase Config Boot

**Date:** 2026-03-24

**Decision:** Public pages render from local defaults without waiting for external services.

---

## Admin Config Write Safety

**Date:** 2026-03-24

**Decision:** Admin config saves use granular updates instead of full overwrites.

---

## Admin Mode System Migration

**Date:** 2026-03-24

**Decision:** Migrated from 3-mode (DEMO/TEST/LIVE) to 2-mode (PREVIEW/LIVE).

---

## Tiny Runtime CTA Controls

**Date:** 2026-03-24

**Decision:** Homepage CTA visibility controlled via tiny remote config read.

---

## Phase 12: Contact System

**Date:** 2026-06-10

**Decision:** Replace `/partnership` with a general `/contact` page. Contact messages stored in new `contacts` table (JSON blob, separate from old `partnerships` column-based table). Admin inbox at `/connectadmin/contacts` with expandable cards, reply via `mailto:`, close/delete actions.

**Reason:**
- Old partnership form was single-purpose
- New contact system handles all inquiries
- Admin needs a way to manage messages (was going to email directly)
- `mailto:` reply is simpler than building email sending infrastructure

---

## Phase 14A: Verification Field Unification

**Date:** 2026-06-10

**Decision:** Unify `verificationStatus` and `reviewStatus` into a single verification flow. Backend now syncs both fields on every write. Frontend reads both with fallback.

**Reason:**
- Bulk verify endpoint (`POST /api/admin/users/verify`) wrote `verificationStatus`
- Single-user verify (`POST /api/admin/users/update`) wrote `reviewStatus`
- Frontend only read `reviewStatus` — bulk verify had no visible effect
- Fix: Backend auto-syncs both fields on all writes. Lookup API falls back: `reviewStatus || verificationStatus`

---

## Phase 14C: Campaign Page Rewrite

**Date:** 2026-06-10

**Decision:** Rewrite campaign page to use dedicated endpoints instead of downloading entire user database to browser.

**Reason:**
- Old code called `api.get("users")` — exposed all PII to every visitor
- `api.transaction()` was a NO-OP — task completions never saved
- `userApi.completeTask()` existed but was unused
- `userApi.lookup()` now provides username→user mapping without data leak
- Campaign config now loaded via `publicApi.getConfig()` instead of deprecated routes

---

## Phase 14C: MXP Audit Trail

**Date:** 2026-06-10

**Decision:** Add `admin_audit_log` table to track every MXP change with: userId, adminEmail, field, oldValue, newValue, note, timestamp. Add validation: max ±10K per adjustment, max 1M total MXP, rate limited 30/min.

**Reason:**
- No history of who changed what MXP and when
- `adminNote` was stored on user record (easily overwritten)
- No limits meant admin could set any value
- Audit log is append-only, never overwritten

---

## Phase 14D: Refresh Button

**Date:** 2026-06-10

**Decision:** Add a refresh button (🔄/⏳) to homepage and checknfts. 30-second cooldown. Reloads user data (mxp, referrals, status) from API. No polling, no auto-refresh.

**Reason:**
- Users needed a way to see updated verification status without logging out/in
- 30s cooldown prevents abuse
- Simpler than auto-refresh or WebSockets
- Architecture explicitly avoids polling

---

## Login Flow: `api.get("users")` → `userApi.lookup()`

**Date:** 2026-06-11

**Decision:** Replace the login flow's `api.get("users")` (downloads ALL users to browser, linear scan) with `userApi.lookup(username)` (single-user indexed lookup via `GET /api/user/lookup?username=`).

**Reason:**
- `api.get("users")` downloaded ENTIRE user database to every visitor's browser for login
- Linear scan through all users was slow and insecure
- Login was broken on VPS because `[DEPRECATED]` warnings masked the real issue
- New approach: backend strips `@` and lowercases, does indexed lookup via `usernames` table
- Works with `@orchid`, `orchid`, `Orchid`, `@ORCHID` — all normalized

## Upload: Nginx Serves Uploaded Files

**Date:** 2026-06-11

**Decision:** Serve `/uploads/` files via nginx `location` block with `alias` to host filesystem, bypassing Next.js. Auto-delete old files on replace via `DELETE /api/admin/upload`.

**Reason:**
- Next.js in production mode doesn't serve files added to `public/` after build
- Docker volume mounts `./public/uploads:/app/public/uploads` — files persist across rebuilds
- Nginx `location /uploads/` serves files directly with 30-day cache
- Old files auto-deleted when replacing images (upload or URL change)

---

## xpLabel Rename: "EXP" → "MXP"

**Date:** 2026-06-10

**Decision:** Rename `xpLabel` from `"EXP"` to `"MXP"` in `site-config.ts` to unify naming across the platform.

**Reason:**
- Tasks display `"+10 MXP"` but balance label showed `"EXP"` — two names for the same thing
- `"MAGIC POINT"` is the full name, `"MXP"` is the short/ticker form
- `gxp` was a third legacy name (now removed)
- Single-line change in `site-config.ts` — all 22 references across 5 files auto-updated

## gxp Legacy Cleanup

**Date:** 2026-06-10

**Decision:** Remove all `gxp` references and fallbacks (`|| x.gxp || 0`) from the codebase. Every read of user points now uses `mxp` only.

**Reason:**
- `gxp` was a legacy field name, never set by new code
- 16 fallback references across 4 files added noise with zero benefit
- `mxp` is the canonical database field for points
