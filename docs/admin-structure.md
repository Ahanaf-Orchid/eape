# Admin Structure

**Last updated:** 2026-06-10

This document maps each admin page to its ownership and API endpoint.
All admin operations are Layer 3 (backend-validated, always authenticated).

## Architecture

Admin panel is Layer 3 — all writes are validated server-side.
Admin must be authenticated (session via `/api/admin/login`) for all operations.

## Active Pages

### `/connectadmin/home` — Primary Homepage Admin

**Writes to:** `POST /api/admin/config/update`
**Reads from:** `GET /api/config/public`

| Section | Fields | Config Path |
|---------|--------|-------------|
| Connect Behavior | `connectBehavior`, `connectBehaviorBadgeVisible` | `config/homepage.connectBehavior` |
| CTA Visibility | `ctaVisibility.campaign` | `config/homepage.ctaVisibility` |
| Page Availability | `pageRuntime.campaign.enabled` | `config/homepage.pageRuntime` |
| Balance Labels | `showBalanceSection`, balance labels | `config/homepage.balanceLabels` |
| Task Editor | `taskNames`, `taskUrls`, `taskMxp` | `config/homepage.task*` |
| Status Editor | `statusNames`, `statusLevels` | `config/homepage.status*` |
| Referral Settings | `mxpRewards.*` | `config/homepage.mxpRewards` |

### `/connectadmin/campaign` — Campaign Config

**Writes to:** `POST /api/admin/campaign/save`
**Reads from:** `GET /api/config/public`

Manages daily campaign tasks including: taskId, title, description, link, rewardXp, active status, proofType, order.

### `/connectadmin/holders` — User Management

**Reads/writes:** `GET /api/admin/users`, `POST /api/admin/users/update`

View and manage user MXP values and admin notes.

### `/connectadmin/verify` — User Verification

**Reads/writes:** `GET /api/admin/users`, `POST /api/admin/users/verify`

Bulk user verification. Admin selects users → clicks "Verify Selected" → one backend call.

### `/connectadmin` — Root Admin Dashboard

**Reads:** `GET /api/admin/stats`, `GET /api/admin/users`
**Actions:** CSV export, data migration, theme switcher

### `/connectadmin/images` — Image Manager

**Legacy admin page** — being phased out.

## Retired Pages

### `/connectadmin/mode`
**Retired** — notice page pointing to `/connectadmin/home`.

## API Endpoints (All Admin)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/admin/login` | Login | None (credentials in body) |
| POST | `/api/admin/config/update` | Save config | Admin session required |
| POST | `/api/admin/campaign/save` | Save campaign | Admin session required |
| POST | `/api/admin/users/verify` | Bulk verify users | Admin session required |
| POST | `/api/admin/users/update` | Update single user | Admin session required |
| GET | `/api/admin/users` | List users (paginated) | Admin session required |
| GET | `/api/admin/stats` | Dashboard stats | Admin session required |

## Admin Auth

- **Login**: `POST /api/admin/login` with `{ email, password }` → compares against env vars
- **Session**: localStorage token with 15-minute expiry
- **Key**: `${SITE.shortName}_admin_session` (from site-config.ts)
- **Validation**: Every admin API endpoint validates the session token
- **Credentials**: Server-side only — never in `NEXT_PUBLIC_*` env vars

## Deprecated Endpoints (Phase 11B)

The following are being replaced:

| Old Endpoint | Replacement |
|-------------|-------------|
| `PUT /api/data/config/homepage` | `POST /api/admin/config/update` |
| `PUT /api/data/config/campaign` | `POST /api/admin/campaign/save` |
| `PUT /api/data/users/:id` | `POST /api/admin/users/update` |
| `GET /api/data/users` | `GET /api/admin/users` |
| `GET /api/data/device_logins` | `GET /api/admin/stats` |
