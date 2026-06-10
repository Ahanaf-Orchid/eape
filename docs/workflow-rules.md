# Workflow Rules

**Last updated:** 2026-06-10

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
| Phase 1 | Mode system migration (3-mode → 2-mode) |
| Phase 2 | Tiny runtime CTA controls |
| Phase 3 | Admin config write safety |
| Phase 4 | Admin clarity cleanup |
| Phase 5 | sharedUi ownership cleanup |
| Phase 6 | Homepage admin, connect behavior, task/status unification |
| Phase 7 | Startup overlay |
| Phase 8 | Campaign hybrid cleanup |
| Phase 9 | Firebase → SQLite migration + VPS prep |
| Phase 10 | Rebrand "Michy" → "Ethereum Apes" + UI polish |
| **Phase 11** | **3-Layer Architecture Restructuring (current)** |

## Phase 11 Sub-Phases

| Phase | Description |
|-------|-------------|
| 11A | Architecture documentation |
| 11B | Split generic API into dedicated endpoints |
| 11C | Move Layer 2 defaults into site-config.ts |
| 11D | Fix multi-step registration (single atomic call) |
| 11E | Auth guards + rate limiting |
| 11F | Merge duplicate pages (page.tsx + checknfts/page.tsx) |
| 11G | Security hardening |
| 11H | Update all docs |

## Fresh Session Read Order

1. **`docs/ARCHITECTURE.md`** — canonical architecture reference (always start here)
2. **`docs/source-of-truth.md`** — quick-reference summary
3. **`docs/workflow-rules.md`** — phase structure and rules
4. **`src/lib/site-config.ts`** — brand constants

## Git Conventions

- `main` — production (deployed)
- `develop` — active development
- `feature/*` — feature branches
- `fix/*` — bug fixes
- Never commit: `/private/`, `/data/`, `.env.local`, `node_modules/`

## Layer Architecture Reference

```
Layer 1: Hardcoded Frontend UI    — instant render, no backend calls
Layer 2: Editable Public Config   — fetched once on page load
Layer 3: Backend Validated Data   — always server-side validated
```
