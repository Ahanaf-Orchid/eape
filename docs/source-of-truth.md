# Source of Truth

**Last updated:** 2026-06-10
**Latest phase:** Phase 11 — 3-Layer Architecture Restructuring

> **IMPORTANT:** The canonical architecture reference is now **[docs/ARCHITECTURE.md](./ARCHITECTURE.md)**.
> This file is a quick-reference summary, not the full spec.

## Current Architecture

The platform follows a strict 3-layer model:

| Layer | Name | Dependency | Key Files |
|-------|------|-----------|-----------|
| 1 | Hardcoded Frontend UI | None — instant render | `page.tsx`, components, `site-config.ts` |
| 2 | Editable Public Config | `GET /api/config/public` on load | Admin panel writes, frontend reads |
| 3 | Backend Validated Data | Server-side only | API routes + SQLite |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite via `better-sqlite3` (WAL mode) — `data/eape.db` |
| API | Dedicated Next.js API Routes (no generic catch-all for sensitive ops) |
| Auth (admin) | Server-side credential check via `/api/admin/login` |
| Hosting | Hostinger KVM 4 (4 CPU, 16GB RAM, 200GB SSD) |
| Deployment | Private GitHub → Docker Compose (app + nginx) |
| SSL | Let's En crypt via nginx |
| Config | `/private/` directory (gitignored) for secrets |

## Data Flow

```
Page load:
  1. Layer 1 renders instantly (layout, buttons, sections)
  2. GET /api/config/public — Layer 2 config fetch
  3. User action → POST /api/user/register or POST /api/campaign/complete-task
  4. Backend validates everything, returns result

No polling. No WebSockets. No generic catch-all for sensitive ops.
```

## Pages

| Page | Layers | Backend Calls |
|------|--------|---------------|
| `/` (Home) | 1+2 | `GET /api/config/public` on load, `POST /api/user/register` on submit |
| `/checknfts` | 1+2 | Same as home (to be merged) |
| `/campaign` | 1+2 | `GET /api/config/public` on load, `POST /api/campaign/complete-task` on action |
| `/partnership` | 1 | `POST /api/form/partnership` on submit |
| `/invest-early` | 1 | `POST /api/form/invest-early` on submit |
| `/connectadmin` | 3 | Admin auth + dedicated admin endpoints |

## Database Schema

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `config` | Key-value runtime config | `path TEXT PK`, `value TEXT(JSON)` |
| `users` | User profiles | `id TEXT PK`, `data TEXT(JSON)` |
| `usernames` | Unique username claims | `username TEXT PK`, `userId` |
| `wallets` | Unique wallet claims | `wallet TEXT PK`, `userId` |
| `sol_wallets` | Solana wallet claims | `solWallet TEXT PK`, `userId` |
| `device_submissions` | Anti-spam tracking | `deviceId TEXT PK`, `data TEXT(JSON)` |
| `referral_events` | Referral tracking | `id TEXT PK`, `data TEXT(JSON)` |
| `device_logins` | Admin login tracking | `deviceId TEXT PK`, `count`, `lastLogin` |
| `partnerships` | Partnership form submissions | `id TEXT PK`, fields |
| `invest_early` | Invest early submissions | `id TEXT PK`, fields |

## API Endpoints

### Public

| Method | Endpoint | Layer | Purpose |
|--------|----------|-------|---------|
| GET | `/api/config/public` | 2 | Fetch all public config |
| POST | `/api/user/register` | 3 | Atomic user registration |
| POST | `/api/campaign/complete-task` | 3 | Complete a campaign task |
| POST | `/api/form/partnership` | 1 | Partnership inquiry |
| POST | `/api/form/invest-early` | 1 | Invest early inquiry |

### Admin (authenticated)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/login` | Admin authentication |
| POST | `/api/admin/config/update` | Save public config |
| POST | `/api/admin/campaign/save` | Save campaign config |
| POST | `/api/admin/users/verify` | Bulk user verification |
| GET | `/api/admin/users` | List users (paginated) |
| GET | `/api/admin/stats` | Dashboard statistics |

## Key Design Decisions

- **Multi-step flows**: Frontend collects all data locally → ONE final backend call
- **Backend validates everything**: Never trust frontend-sent reward amounts, task IDs, or user roles
- **Structured errors**: Backend returns `{ success, step, field, message }` — never generic "Something went wrong"
- **No polls or WebSockets**: Config loaded once on page visit, backend called only on user action
- **Anti-spam**: Backend checks device ID, rate limits on registration and task completion

## Brand Constants

Defined in `src/lib/site-config.ts` — single file, change name here → rebuild → redeploy.

```
projectName: "Ethereum Apes"
shortName: "EAPE"
pointsName: "MAGIC POINT"
xpLabel: "EXP"
balanceLabel: "MAGIC POINT"
tokenSymbol: "$EAPE"
hashtag: "#EAPE $EAPE"
twitterUrl: "https://x.com/EthereumApes"
telegramUrl: "https://t.me/ethereumapes"
lsKeys: { user, cache, homepageCache, deviceId }
dbName: "eape.db"
```

## Repository Structure

```
EAPE/
├── src/                    # Application source
│   ├── app/                # Next.js pages + API routes
│   ├── components/         # Reusable React components
│   ├── contexts/           # React contexts
│   └── lib/                # Shared libraries
├── public/shared/          # Shared SVGs
├── data/                   # SQLite database (gitignored)
├── private/                # Secure configs (gitignored)
├── docs/                   # Project documentation
└── Dockerfile / docker-compose.yml / nginx.conf
```

## What NOT to Use

- `/api/data/[path]` — being deprecated, replaced by dedicated endpoints
- `config/mode`, `config/modeVisible` — retired
- `config/mint/*`, `config/buy/*` — deleted
- `config/sharedUi/*` — legacy, being phased out
- Firebase SDK — removed
- `gippo_admin_session` localStorage key — to be fixed
