# Migration Plan: Firebase → SQLite + Hostinger VPS

**Created:** 2026-06-10
**Status:** COMPLETE (Phase 9)

All phases complete. See `docs/deploy-guide.md` for production deployment steps.

---

## Completed Phases

### Phase 9A: Delete Unwanted Pages ✅
- Deleted `src/app/buy/`, `src/app/mint/`, `src/app/connectadmin/mint/`, `src/app/connectadmin/buy/`
- Deleted `public/buy/`, `public/mint/`
- Updated all cross-references in 5 source files
- Updated all docs

### Phase 9B: SQLite Database Setup ✅
- Installed `better-sqlite3` + `@types/better-sqlite3`
- Created `src/lib/db.ts` — init + schema + 20+ helper functions
- 10 tables: config, users, usernames, wallets, sol_wallets, device_submissions, referral_events, device_logins, partnerships, invest_early
- WAL mode enabled
- `data/` added to `.gitignore`

### Phase 9C: API Routes ✅
- Created `src/lib/api.ts` — client-side fetch wrapper
- Created `src/app/api/data/[path]/route.ts` — unified CRUD (GET/PUT/PATCH/POST/DELETE)
- Created `src/app/api/submit/[type]/route.ts` — form submissions
- Created `src/app/api/admin/login/route.ts` — server-side auth

### Phase 9D: Rewire All Pages ✅
- All 11 source files migrated from Firebase SDK to `api.ts`
- Pattern: `get(ref(database, "path"))` → `api.get("path")`
- Pattern: `snapshot.val()` → return value directly
- Pattern: `snapshot.exists()` → `!== null` check
- Pattern: transactions → api.get + api.set

### Phase 9E: Admin Auth Security ✅
- Moved credentials from `NEXT_PUBLIC_*` (client-exposed) to server-side only
- Created `/api/admin/login` endpoint
- Updated `AdminAuthContext` to call API
- Fixed all 4 admin login callers to use `await`

### Phase 9F: Data Migration Script ✅
- Created `scripts/migrate-from-firebase.ts`
- Downloads all data from Firebase RTDB
- Transforms and inserts into SQLite tables
- Includes record count verification

### Phase 9G: Deployment Config ✅
- Created `Dockerfile` (Node 22 Alpine)
- Created `docker-compose.yml` (app + nginx)
- Created `nginx.conf` (reverse proxy)

### Phase 9H: Cleanup ✅
- Removed `firebase` npm dependency
- Deleted `src/lib/firebase.ts`
- Deleted `docs/firebase-rules-temp.md`
- `npm run build` passes clean (zero errors)

---

## Pending (Phase 10)

1. **Populate `public/shared/`** — 9 SVG files needed
2. **Run migration script** — `npx ts-node scripts/migrate-from-firebase.ts`
3. **Create private git repo** — push code
4. **Deploy to KVM 4** — see `docs/deploy-guide.md`
5. **Wire domain + SSL**
6. **Post-deploy verification**

## Database Schema (Final)

```sql
config              (path TEXT PK, value TEXT)
users               (id TEXT PK, data TEXT)
usernames           (username TEXT PK, userId TEXT)
wallets             (wallet TEXT PK, userId TEXT)
sol_wallets         (solWallet TEXT PK, userId TEXT)
device_submissions  (deviceId TEXT PK, data TEXT)
referral_events     (id TEXT PK, data TEXT)
device_logins       (deviceId TEXT PK, count INT, lastLogin INT)
partnerships        (id TEXT PK, twitter, email, telegram, message, submittedAt INT)
invest_early        (id TEXT PK, twitter, email, amount, message, submittedAt INT)
```

## API Client Usage

```ts
import { api } from "@/lib/api";

// Read
const users = await api.get("users");
const config = await api.get("config/homepage");

// Write  
await api.set("users/abc123", userData);
await api.update("users/abc123", { mxp: 500 });
const { id } = await api.push("users", newUser);

// Forms
await api.submit("partnerships", { twitter, email, message });
```
