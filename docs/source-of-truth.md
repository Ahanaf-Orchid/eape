# Source of Truth

**Last updated:** 2026-06-12
**Latest phase:** Phase 17 — Campaign Final Submit Batch API

> **IMPORTANT:** The canonical architecture reference is **[docs/ARCHITECTURE.md](./ARCHITECTURE.md)**.
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
| SSL | Let's Encrypt via nginx |
| Config | `/private/` directory (gitignored) for secrets |

## Data Flow

```
Page load:
  1. Layer 1 renders instantly (layout, buttons, sections)
  2. GET /api/config/public — Layer 2 config fetch
  3. User action → POST /api/user/register or POST /api/campaign/complete-task
  4. Backend validates everything, returns result

No polling. No WebSockets. No generic catch-all for sensitive ops.
No public all-user reads — leaderboard returns sanitized data only.
```

## Pages

| Page | Layers | Backend Calls |
|------|--------|---------------|
| `/` (Home) | 1+2 | `GET /api/config/public` on load, `POST /api/user/register` on submit, `GET /api/leaderboard` for leaderboard |
| `/checknfts` | 1+2 | Same as home |
| `/campaign` | 1+2+3 | `GET /api/config/public` on load, `POST /api/campaign/complete-task` on action |
| `/contact` | 1 | `POST /api/form/contact` on submit |
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
| `contacts` | Contact form submissions | `id TEXT PK`, `data TEXT(JSON)` |
| `invest_early` | Invest early submissions (legacy) | `id TEXT PK`, `data TEXT(JSON)` |
| `admin_audit_log` | MXP adjustment audit | `id TEXT PK`, `data TEXT(JSON)` |

## API Endpoints

### Public

| Method | Endpoint | Layer | Purpose | Rate Limit |
|--------|----------|-------|---------|-----------|
| GET | `/api/config/public` | 2 | Fetch all public config | None |
| GET | `/api/leaderboard` | 3 | Top 15 referrers/holders (sanitized) | None |
| GET | `/api/user/lookup` | 3 | Single-user lookup | 60/min/IP |
| POST | `/api/user/register` | 3 | Atomic user registration | 5/min/IP |
| POST | `/api/campaign/complete-task` | 3 | Campaign task completion | 10/min/IP |
| POST | `/api/campaign/final-submit` | 3 | Batch task completion (multiple tasks at once) | 10/min/IP |
| POST | `/api/campaign/claim-daily-reward` | 3 | Daily reward claim (once per day) | 5/min/IP |
| POST | `/api/form/contact` | 1 | Contact form submission | 5/min/IP |

### Admin (authenticated)

| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|-----------|
| POST | `/api/admin/login` | Admin authentication | 5/min/IP |
| GET | `/api/admin/config` | Read config | — |
| POST | `/api/admin/config` | Write config | — |
| POST | `/api/admin/config/update` | Update config block | — |
| POST | `/api/admin/campaign/save` | Save campaign config | — |
| GET | `/api/admin/users` | List users (paginated) | — |
| POST | `/api/admin/users/update` | Update user + audit | 30/min/IP |
| POST | `/api/admin/users/verify` | Bulk user verification | — |
| GET | `/api/admin/stats` | Dashboard statistics | — |
| GET | `/api/admin/contacts` | List contact messages | — |
| POST | `/api/admin/contacts/update` | Close/delete contacts | — |
| POST | `/api/admin/upload` | File upload | — |
| DELETE | `/api/admin/upload` | Delete uploaded file | — |

### Locked

| Method | Endpoint | Purpose |
|--------|----------|---------|
| * | `/api/data/[path]` | Returns 410 Gone — deprecated |

## Key Design Decisions

- **Multi-step flows**: Frontend collects all data locally → ONE final backend call
- **Backend validates everything**: Never trust frontend-sent reward amounts, task IDs, or user roles
- **Structured errors**: Backend returns `{ success, step, field, message }` — never generic "Something went wrong"
- **No polls or WebSockets**: Config loaded once on page visit, backend called only on user action
- **Anti-spam**: Backend checks device ID, rate limits on registration, task completion, contact, lookup, login
- **No public all-user reads**: Leaderboard returns only `{ rank, username, value }`

## Brand Constants

Defined in `src/lib/site-config.ts` — single file, change name here → rebuild → redeploy.

```
projectName: "Ethereum Apes"
shortName: "EAPE"
xpLabel: "MXP"
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
│   │   ├── page.tsx        # Homepage
│   │   ├── checknfts/      # CheckNFTs page
│   │   ├── campaign/       # Campaign page
│   │   ├── contact/        # Contact page
│   │   ├── connectadmin/   # Admin panel pages
│   │   └── api/            # API routes
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

- `/api/data/[path]` — locked to 410 Gone
- `config/mode`, `config/modeVisible` — retired
- `config/mint/*`, `config/buy/*` — deleted
- `config/sharedUi/*` — legacy, being phased out
- Firebase SDK — removed
- `api.submit()` — removed
- `formApi.partnership()` — removed
- `formApi.investEarly()` — removed
- `api.get("users")` — eliminated
