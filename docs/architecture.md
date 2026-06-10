# Architecture — 3-Layer Model

**Last updated:** 2026-06-10
**Phase:** 11 — Architecture Audit & API Restructuring

---

## Overview

The platform follows a strict 3-layer architecture:

| Layer | Name | Description | Backend Dependency |
|-------|------|-------------|-------------------|
| 1 | Hardcoded Frontend UI | Static design, layout, animations, fallback text | None |
| 2 | Editable Public Config | Admin-editable display values loaded on page visit | `GET /api/config/public` on page load |
| 3 | Backend Validated Data | User data, rewards, verification, task completion | Always validated server-side |

No polling.
No WebSockets.
No periodic refresh.
Backend is called only when a meaningful action happens.

---

## Layer 1 — Hardcoded Frontend UI

These values live in the frontend code and are NEVER admin-editable.
They belong to the design and visual structure of the site.

### What goes here:

| Category | Examples | File Location |
|----------|----------|---------------|
| Page layout | Section order, container widths, grid structure | `src/app/*/page.tsx` |
| Animations | Loading spinners, transitions, startup overlay | `src/app/page.tsx` |
| Modal design | Layout of CHECK ROLE, ALREADY WHITELISTED modals | `src/app/page.tsx` |
| Button styles | CSS classes, color scheme, hover effects | `src/app/page.tsx` + Tailwind |
| Step flow UI | Multi-step progression (Identify → Verify → Engage → Wallet → Submit) | `src/app/page.tsx` |
| Visual components | Step wrapper, Task card, StatsCard, PageContainer | `src/components/*.tsx` |
| Fallback text | "Loading...", error messages, empty state text | `src/app/*/page.tsx` |
| Brand identity | `projectName`, `shortName`, `xpLabel`, `tokenSymbol` | `src/lib/site-config.ts` |
| Local storage keys | Keys for caching user session, device ID, config cache | `src/lib/site-config.ts` |

### Rules:
- Layer 1 NEVER calls the backend.
- Layer 1 renders instantly on page load.
- Layer 1 values are changed by editing the source code and rebuilding.

---

## Layer 2 — Editable Public Config

These values are admin-editable and fetched from the backend once on page load.
They affect what users see but have NO impact on rewards, validation, or security.

### What goes here:

| Category | Examples | Config Path |
|----------|----------|-------------|
| Twitter/X link | Admin's official Twitter URL | `config/homepage.taskUrls.twitter` |
| Telegram link | Admin's official Telegram URL | `config/homepage.taskUrls.telegram` |
| Task names | Labels for user-facing tasks | `config/homepage.taskNames` |
| Task URLs | Links users must visit for tasks | `config/homepage.taskUrls` |
| Task MXP values | Displayed reward amounts per task | `config/homepage.taskMxp` |
| Status names | Tier labels (VIP, SHARK, WHALE, BOSS) | `config/homepage.statusNames` |
| Status levels | Referral thresholds per status | `config/homepage.statusLevels` |
| Section titles | "IDENTIFY", "VERIFY", "ENGAGE" step titles | `config/homepage.stepTitles` |
| Button labels | All CTA/link button text | `config/homepage.buttonLabels` |
| Balance labels | Token balance display names | `config/homepage.balanceLabels` |
| Quote-tweet templates | Pre-written post text for QT tasks | `config/homepage.qtOptions` |
| Banner image | Homepage hero banner path | `config/homepage.bannerImage` |
| Campaign config | Daily campaign tasks, titles, links, rewards | `config/campaign` |
| Connect behavior | Wallet behavior toggle (REGISTERED_WALLETS / REAL_WALLET_REQUIRED) | `config/homepage.connectBehavior` |
| CTA visibility | Toggle campaign button visibility | `config/homepage.ctaVisibility` |
| MXP reward defaults | Displayed bonus amounts (username, invitee, referral) | `config/homepage.mxpRewards` |

### Fetch flow:

```
1. Page loads → Layer 1 renders immediately (layout, buttons, sections)
2. Page fetches GET /api/config/public (single call)
3. Response merges into state, replacing Layer 1 defaults where admin has values
4. Config cached in localStorage for same-session repeat visitors
```

### Rules:
- Layer 2 is fetched ONCE on page load. No polling.
- Users who already have the page open may see old values — acceptable.
- Users who refresh or revisit get the latest config.
- Layer 2 values are NEVER trusted for reward calculation or validation.
- Layer 2 writes go through `POST /api/admin/config/update` (authenticated).

---

## Layer 3 — Backend Validated Data

These values are sensitive. Backend ALWAYS validates and saves.
Frontend NEVER decides rewards, verification status, or user roles.

### What goes here:

| Category | Endpoint | Validation |
|----------|----------|------------|
| Username | `POST /api/user/register` | Uniqueness, format, anti-spam |
| Wallet address | `POST /api/user/register` | Format, uniqueness, duplicate check |
| Referral code | `POST /api/user/register` | Valid inviter exists |
| Task completion | `POST /api/campaign/complete-task` | Task exists, is active, not duplicate |
| Proof URL | `POST /api/campaign/complete-task` | Format, required for specific tasks |
| MXP/XP rewards | Server-calculated | Backend reads official reward value from config |
| Referral count | Server-calculated | Counted from referral_events table |
| Whitelist status | `POST /api/admin/verify` | Admin action only |
| Roles & rank | Server-calculated | Based on verified referral count |
| Reward claims | `POST /api/user/claim` | Duplicate check, eligibility |
| Duplicate checks | Server-side | Username, wallet, device ID uniqueness |
| Admin auth | `POST /api/admin/login` | Server-side credential comparison |

### Rules:
- Frontend never decides reward amounts.
- Frontend never marks a user as verified.
- Backend stores the official reward values.
- Backend validates every request against stored/official data.
- No generic catch-all API for sensitive operations.

---

## Multi-Step Flows

For flows like "Get Whitelisted" (Identify → Verify → Engage → Wallet → Submit):

```
Step 1: Username           │
Step 2: Wallet             │  Frontend collects all data
Step 3: Social tasks       │  locally (state/session storage)
Step 4: Proof              │
Step 5: Review             │
            │
            ▼
    User clicks SUBMIT
            │
            ▼
    POST /api/user/register  ← ONE backend call
    { username, wallet, solWallet, invitee, deviceId,
      taskCompletions: [{ taskId, proofUrl }], ... }
            │
            ▼
    Backend validates everything atomically
            │
            ▼
    { success: true, user: updatedUserData }
    OR
    { success: false, step: 3, field: "proofUrl",
      message: "Invalid proof URL — must be a valid X/Twitter post" }
```

Frontend on error: keep all user data, navigate back to the failed step, show exact error.

### Error response format (back-end):

```json
{
  "success": false,
  "step": 3,
  "field": "proofUrl",
  "message": "The proof URL does not appear to be a valid X/Twitter post"
}
```

No generic "Something went wrong." messages.

---

## Daily Campaign

### Admin saves campaign config:

```
POST /api/admin/campaign/save
{
  tasks: [
    { taskId: "t1", title: "Follow @EthereumApes", description: "...",
      link: "https://x.com/EthereumApes", rewardXp: 10,
      active: true, proofType: "none", order: 1 },
    ...
  ],
  version: 2
}
```

Backend stores official task config with reward XP values.

### User completes a task:

```
POST /api/campaign/complete-task
{
  userId: "abc123",
  taskId: "t1",
  proof: "https://x.com/user/status/123"
}
```

Backend validates:
1. Does this `taskId` exist in the official campaign config?
2. Is the task `active`?
3. Has the user already completed this task?
4. What is the official `rewardXp`?
5. Is proof valid if required?
6. Is the user allowed to complete this task?

Backend returns:

```json
{
  "success": true,
  "user": { "mxp": 150, "campaignCompletedTasks": ["t1"], "campaignVersion": 2 }
}
```

Or on failure:

```json
{
  "success": false,
  "field": "taskId",
  "message": "This task is no longer active."
}
```

Backend NEVER trusts frontend-sent reward amounts, task titles, or links.

---

## User Verification (Admin)

Admin selects users → clicks "Verify Selected" → one backend call:

```
POST /api/admin/users/verify
{
  userIds: ["user1", "user2", "user3"],
  action: "verify"
}
```

Backend validates:
- Admin session/authentication
- Each user exists and is eligible
- Returns per-user results

Response:

```json
{
  "success": true,
  "verifiedUsers": ["user1", "user2"],
  "failedUsers": [
    { "userId": "user3", "reason": "User already rejected" }
  ]
}
```

Frontend shows which users succeeded/failed.

---

## API Design

### Public endpoints (no auth):

| Method | Endpoint | Purpose | Layer |
|--------|----------|---------|-------|
| GET | `/api/config/public` | Fetch all public config | 2 |
| POST | `/api/user/register` | Register (final submit of multi-step flow) | 3 |
| POST | `/api/campaign/complete-task` | Mark task done, get reward | 3 |

### Authenticated endpoints (admin session required):

| Method | Endpoint | Purpose | Layer |
|--------|----------|---------|-------|
| POST | `/api/admin/login` | Admin auth | 3 |
| POST | `/api/admin/config/update` | Save Layer 2 config | 3 |
| POST | `/api/admin/campaign/save` | Save campaign config | 3 |
| POST | `/api/admin/users/verify` | Verify/disqualify users | 3 |
| GET | `/api/admin/users` | List users (admin only) | 3 |
| GET | `/api/admin/stats` | Dashboard stats | 3 |

### Form endpoints (no auth, validated storage):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/form/partnership` | Partnership inquiry |
| POST | `/api/form/invest-early` | Early investment inquiry |

### Rules:
- No generic catch-all (`/api/data/[path]`) for sensitive operations.
- Each sensitive action has a dedicated endpoint.
- Admin endpoints validate admin session on every request.
- User registration validates everything atomically in one request.

---

## User Registration Flow (Refactored)

### Before (current — incremental API calls):

1. User enters username → frontend validates uniqueness via API
2. User enters wallet → frontend validates uniqueness via API
3. Frontend creates empty user: `POST /api/data/users`
4. Frontend claims username: `PUT /api/data/usernames/<name>`
5. Frontend claims wallet: `PUT /api/data/wallets/<addr>`
6. Frontend saves full user: `PUT /api/data/users/<id>`
7. Frontend updates referrer: `PUT /api/data/users/<inviterId>`

### After (target — single atomic call):

1. Frontend collects all data locally (state/session storage)
2. User clicks final submit
3. Frontend sends ONE request: `POST /api/user/register`
4. Backend validates everything, creates user, claims username/wallet,
   updates referrer, records referral event — all atomically
5. Backend returns full user data or structured error with step/field/message

---

## Caching

### Layer 2 config cache (localStorage):

- Key: `SITE.lsKeys.homepageCache` (from `site-config.ts`)
- Values: connectBehavior, ctaVisibility (fast boot for repeat visitors)
- Never cache user data or reward values.

### What is NOT cached:
- User data (always fetched when needed)
- Reward values (always from backend)
- Campaign config (fresh per visit)

---

## Current State vs Target

### Layer 1 — Currently has values that belong in Layer 2:

| Value | Current Location | Target |
|-------|-----------------|--------|
| Task URLs (Nightrarelabs) | Hardcoded in `page.tsx`, `checknfts/page.tsx` | `site-config.ts` as defaults, overridable by Layer 2 |
| Task labels | Hardcoded defaults | `site-config.ts` as defaults, overridable by Layer 2 |
| Task MXP values | Hardcoded defaults | `site-config.ts` as defaults, overridable by Layer 2 |
| Button labels | Hardcoded defaults | `site-config.ts` as defaults, overridable by Layer 2 |
| Status names/levels | Hardcoded + `nft-config.ts` | `site-config.ts` as defaults, overridable by Level 2 |
| Step titles | Hardcoded defaults | `site-config.ts` as defaults, overridable by Layer 2 |
| QT templates | Hardcoded defaults | `site-config.ts` as defaults, overridable by Layer 2 |
| Balance labels | Hardcoded defaults | `site-config.ts` as defaults, overridable by Layer 2 |
| Banner image path | Hardcoded defaults | `site-config.ts` as defaults, overridable by Layer 2 |
| Campaign default | Hardcoded defaults | `site-config.ts` as defaults, overridable by Layer 2 |

### Layer 3 — Currently has security issues:

| Issue | Current | Target |
|-------|---------|--------|
| Data API auth | None | Admin-only on user/admin routes |
| User list exposure | `GET /api/data/users` returns ALL users | Dedicated admin-only endpoint with pagination |
| Reward calculation | Frontend computes MXP | Backend computes from stored config values |
| Generic API | Everything through `/api/data/[path]` | Dedicated endpoints for sensitive actions |
| Rate limiting | None | Add throttle on user registration + task completion |

---

## File Map

| File | Layer | Role |
|------|-------|------|
| `src/lib/site-config.ts` | 1 | Brand constants + default values for Layer 2 |
| `src/app/page.tsx` | 1+2 | Homepage UI (1) with public config fetch (2) |
| `src/app/checknfts/page.tsx` | 1+2 | Near-duplicate of page.tsx — to be merged |
| `src/app/campaign/page.tsx` | 1+2 | Campaign UI + config fetch |
| `src/app/partnership/page.tsx` | 1 | Static form, submits via `/api/form/partnership` |
| `src/app/invest-early/page.tsx` | 1 | Static form, submits via `/api/form/invest-early` |
| `src/app/connectadmin/` | 3 | Admin panel (authenticated) |
| `src/app/api/config/public/route.ts` | 2 | Public config endpoint (NEW — to split from catch-all) |
| `src/app/api/user/register/route.ts` | 3 | User registration (NEW) |
| `src/app/api/campaign/complete-task/route.ts` | 3 | Task completion (NEW) |
| `src/app/api/admin/login/route.ts` | 3 | Admin auth (exists) |
| `src/app/api/admin/config/update/route.ts` | 3 | Config save (NEW) |
| `src/app/api/admin/campaign/save/route.ts` | 3 | Campaign save (NEW) |
| `src/app/api/admin/users/verify/route.ts` | 3 | User verify (NEW) |
| `src/app/api/data/[path]/route.ts` | — | TO BE DEPRECATED — replace with dedicated endpoints |
| `src/lib/db.ts` | 3 | SQLite layer |
| `src/lib/api.ts` | 1+2 | HTTP client — to be split into public + admin clients |
| `src/lib/nft-config.ts` | 1 | NFT constants — to be merged into site-config.ts |
| `src/components/Task.tsx` | 1 | Task card UI component |
| `src/components/Step.tsx` | 1 | Step wrapper component |
| `src/contexts/AdminAuthContext.tsx` | 3 | Admin auth state |

---

## Implementation Plan

### Phase 11A: Write Architecture Doc ✓ (this document)
### Phase 11B: Split Generic API into Dedicated Endpoints
- Create `/api/config/public` — Layer 2 config reader (no auth)
- Create `/api/user/register` — Layer 3 user registration (atomic)
- Create `/api/campaign/complete-task` — Layer 3 task completion
- Create `/api/admin/config/update` — Authenticated config writer
- Create `/api/admin/campaign/save` — Authenticated campaign writer
- Create `/api/admin/users/verify` — Authenticated user verification
- Add auth guard middleware for admin routes
- Deprecate `/api/data/[path]`

### Phase 11C: Move Layer 2 Defaults into site-config.ts
- Move all DEFAULT_TASKS, DEFAULT_TASK_NAMES, DEFAULT_TASK_URLS, QT_OPTIONS, status names/levels, step titles, button labels, balance labels, banner path, campaign defaults into `site-config.ts`
- Merge `nft-config.ts` into `site-config.ts`

### Phase 11D: Fix Multi-Step Registration
- Rewrite homepage registration to collect all data locally
- Submit one `POST /api/user/register` call at end
- Handle structured error responses (step/field/message)
- Keep user data on validation failure

### Phase 11E: Add Auth Guards + Rate Limiting
- Add admin session check to all `/api/admin/*` endpoints
- Add rate limiting to `/api/user/register` and `/api/campaign/complete-task`
- Admin endpoints: admin session token in Authorization header

### Phase 11F: Merge Duplicate Pages
- Unify `page.tsx` and `checknfts/page.tsx` into shared component
- Config flag controls which flow to render

### Phase 11G: Security Hardening
- Remove `GET /api/data/users` that returns all users
- Admin-only user listing with pagination
- Fix `gippo_admin_session` → `SITE.shortName + "_admin_session"`
- Add CORS/security headers

### Phase 11H: Update All Docs
- Rewrite `source-of-truth.md` (this architecture is now the source of truth)
- Update `homepage-plan.md`
- Update `admin-structure.md`
- Update `decisions.md` (add Phase 11)
- Update `todo.md`
- Update `project-status.md`
- Update `workflow-rules.md`
- Update `README.md` (replace default Next.js template)
- Update `deploy-guide.md` (fix michy references)
- Update `git-setup.md` (fix michy references)
