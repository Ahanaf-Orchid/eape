# Admin Home Page Redesign Spec

**Date:** 2026-06-10
**Status:** Implemented (Build ✅)
**File:** `src/app/connectadmin/home/page.tsx`

## Overview
Rewrote from 858 lines (deprecated API, dead code, modals, mixed auth) to ~340 lines using authenticated `adminApi(token)` with inline expandable sections and Frontend/Backend toggleable tabs.

## Layout

```
┌──────────────────────────────────┐
│  HOMEPAGE SETTINGS        [BACK] │
├──────────────────────────────────┤
│  ┌──────────┐ ┌──────────────┐   │
│  │ FRONTEND │ │   BACKEND    │   │  ← toggleable tabs
│  └──────────┘ └──────────────┘   │
├──────────────────────────────────┤
│  ┌ SECTION ▼ ─────────────────┐  │
│  │  (expandable content)      │  │
│  └────────────────────────────┘  │
│  ┌ SUB-SECTION ▼ ────────────┐   │  ← nested for tasks/status/buttons
│  │  (expandable content)      │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  [ SAVE ] / [ SAVE TO BACKEND ]  │
└──────────────────────────────────┘
```

## FRONTEND Tab — "SAVE"

| # | Section | Content |
|---|---------|---------|
| 1 | **BALANCE DISPLAY** ▼ | Show/hide toggle, EAPE label, SOL label, XP label |
| 2 | **STATUS EDITOR** ▼ | Per status (VIP/Shark/Whale/Boss): name + referrals needed |
| 3 | **PAGE AVAILABILITY** ▼ | Campaign page: Available/Unavailable |
| 4 | **BUTTON EDITOR** ▼ | Per button: label, internal picker (page list + custom path) / external URL, visibility (always/connected/hidden) |

## BACKEND Tab — "SAVE TO BACKEND"

| # | Section | Content |
|---|---------|---------|
| 1 | **WALLET CONNECT** ▼ | Solana: ON/OFF. EVM: ON/OFF. At least one must stay ON. Always live connection. |
| 2 | **TASK EDITOR** ▼ | Per task (6 tasks): name, URL, MXP points |
| 3 | **REFERRAL SETTINGS** ▼ | Username bonus, invitee bonus, per-referral MXP |

## Removed

| Old | Reason |
|-----|--------|
| CTA VISIBILITY / CAMPAIGN BUTTON | User request |
| ADVANCED collapsible wrapper | Button Editor now frontend top-level |
| CONNECT BEHAVIOR toggle | Replaced by Solana/EVM toggles |
| CONNECT BADGE toggle | No longer relevant |
| Separate modal popups | Replaced by inline expandable sections |
| EDIT TASK / EDIT STATUS / EDIT BUTTON dropdowns | Inline expandables per item |

## API Changes

| Call | Endpoint | Auth |
|------|----------|------|
| Load config | `GET /api/admin/config?path=homepage` | `requireAdmin()` |
| Save config | `POST /api/admin/config` (merge mode) | `requireAdmin()` |

### New Endpoint
- `src/app/api/admin/config/route.ts` — GET (read) + POST (update with merge)
- Old `config/update/route.ts` still exists as fallback

## Config Schema

```typescript
interface HomepageData {
  // FRONTEND
  showBalanceSection: boolean;
  balanceLabelMichy: string;
  balanceLabelSol: string;
  balanceLabelXp: string;
  statusNames: Record<string, string>;
  statusLevels: Record<string, number>;
  pageAvailability: Record<string, boolean>;
  homeButtons: Record<string, {
    label: string;
    redirectType: "internal" | "external";
    redirectPath: string;
    visible: "always" | "connected" | "hidden";
  }>;
  // BACKEND
  walletConnect: { solana: boolean; evm: boolean };
  taskNames: Record<string, string>;
  taskUrls: Record<string, string>;
  taskMxp: Record<string, number>;
  mxpRewards: { usernameBonus: number; inviteeBonus: number; perReferral: number };
}
```

## Future Work

- Homepage `page.tsx` still reads old `connectBehavior` field — needs updating to read `walletConnect`
- Homepage still reads old `buttonLabels` field — needs updating to read `homeButtons`
- `walletConnect` needs wiring into the wallet modal (Solana/EVM toggles actually enable/disable wallets)
