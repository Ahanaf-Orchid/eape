# Workflow Rules

**Last updated:** 2026-06-12

## Modes

| Mode | Description |
|------|-------------|
| AUDIT | Inspect only. No code changes. |
| PLAN MODE | Analyze and design only. No code changes. |
| BUILD MODE | Implement one approved phase only. |

## Workflow

1. **Audit/Plan** — Inspect codebase or plan a phase
2. **Build** — Implement one approved phase
3. **Review** — Verify changes and update docs
4. **Repeat** — Move to next phase

## Rules

- One phase per BUILD MODE session
- Do not jump ahead to later phases
- Do not redesign unrelated pages
- Do not touch unrelated user systems
- **After every build phase, docs must be updated**
- `/private/` — never commit, manually sync to VPS
- `/data/` — never commit, backup before deploys

## Phase Naming

| Phase | Description |
|-------|-------------|
| Phase 1-10 | Early Foundation (mode migration, brand, admin, startup, Firebase migration) |
| Phase 11 | 3-Layer Architecture Restructuring |
| Phase 12 | Contact System + Cleanup |
| Phase 13-14 | Image Manager, Data Audit, Verification Fixes, Campaign Rewrite |
| Phase 15E | Production API Cleanup (rate limits, data route locked, no public all-user reads) |
| Phase 16 | Daily Reward System + Remove PAGE UNAVAILABLE |
| Phase 17 | Campaign Final Submit Batch API |

## Fresh Session Read Order

1. **`docs/ARCHITECTURE.md`** — canonical architecture reference (always start here)
2. **`docs/source-of-truth.md`** — quick-reference summary
3. **`docs/workflow-rules.md`** — phase structure and rules (this file)
4. **`src/lib/site-config.ts`** — brand constants
5. **`docs/deploy-guide.md`** — deploy process (credential-free)
6. **`private/deploy-notes.md`** — VPS credentials (gitignored, read for deployment)

## Git Conventions

- `master` — production (deployed)
- `feature/*` — feature branches
- `fix/*` — bug fixes
- Never commit: `/private/`, `/data/`, `.env.local`, `node_modules/`

## Layer Architecture Reference

```
Layer 1: Hardcoded Frontend UI    — instant render, no backend calls
Layer 2: Editable Public Config   — fetched once on page load
Layer 3: Backend Validated Data   — always server-side validated
```

## Deployment

```
1. Push to GitHub (master)
2. Read private/deploy-notes.md for VPS IP + root password
3. Follow docs/deploy-guide.md for commands
4. SSH → backup → git pull → docker compose up -d --build
5. Smoke test: homepage, campaign, admin, leaderboard, 410 check
```
