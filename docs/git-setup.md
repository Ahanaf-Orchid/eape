# Git Setup Guide

**Created:** 2026-06-10
**Updated:** 2026-06-10 (Phase 11)

## Repository

- **Platform**: GitHub
- **Visibility**: Private
- **Organization**: Your GitHub org (or personal account if no org)
- **Name**: `eape`

## Setup Steps

### 1. Create private repo on GitHub

```
gh repo create <org>/eape --private
```

Or manually at https://github.com/new — set to Private.

### 2. Files NOT committed (in .gitignore)

| Path | Reason |
|------|--------|
| `/private/` | VPS credentials, production secrets |
| `/data/` | SQLite database file |
| `.env.local` | May contain dev credentials |
| `node_modules/` | npm dependencies |
| `.next/` | Next.js build output |

### 3. Initial commit

```bash
cd "E:\ALL\WEBSITE\ETHEREUM APES\EAPE"
git init
git add .
git commit -m "Initial commit: Phase 11 — 3-layer architecture restructuring"
git branch -M main
git remote add origin https://github.com/<org>/eape.git
git push -u origin main
```

### 4. Branch strategy

```
main        → Production (deployed to KVM 4)
develop     → Active development
feature/*   → Feature branches
fix/*       → Bug fixes
```

### 5. First deployment from main

```bash
git checkout main
# Build, test, then deploy to VPS
```

## Private Configs

Secrets are stored in `/private/` (gitignored, never committed):

```
private/
├── README.md              # What goes here and why
├── vps-credentials.md     # KVM 4 IP, root password, SSH config
└── env.production         # Production env vars (ADMIN_EMAIL, ADMIN_PASSWORD)
```

These MUST be manually synced to the VPS. Never commit them to git.
