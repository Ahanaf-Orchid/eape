# Homepage Plan

**Last updated:** 2026-06-10

## Architecture Layer

The homepage uses Layers 1 and 2:
- **Layer 1**: Page layout, step flow UI, animations, button styles, fallback text, modals
- **Layer 2**: Task labels/URLs, status names/levels, step titles, button labels, balance labels, QT templates, banner image, mxpRewards, connect behavior, CTA visibility

Layer 2 values are fetched from `GET /api/config/public` on page load.
Layer 2 defaults live in `src/lib/site-config.ts`.

## Multi-Step Flow

The homepage registration flow follows the atomic submission pattern:

```
Step 1: IDENTIFY    — username + invitee
Step 2: VERIFY      — follow tasks
Step 3: ENGAGE 1    — task (like/RT/comment)
Step 4: ENGAGE 2    — task (like/RT/comment)
Step 5: ENGAGE 3    — quote tweet + proof
Step 6: ENGAGE 4    — Telegram
Step 7: WALLET      — EVM + optional SOL
Step 8: REVIEW      — confirm all info
        │
        ▼
    POST /api/user/register  ← ONE backend call
```

Frontend collects all data in state/session storage across steps.
Only on final submit does frontend call backend.

## Current CTA Order

```
1. JOIN [PROJECT]        → primary-btn (red)
2. CHECK ROLE            → secondary-btn (orange)
3. CAMPAIGN              → primary-btn (red)     [conditional]
4. CHECK NFTs            → secondary-btn (orange)
5. LEADERBOARD           → primary-btn (red)
6. GET INVOLVED          → secondary-btn (orange)
```

Button colors alternate by visible button index: even → red, odd → orange.

## Connect Behavior

- `REGISTERED_WALLETS` — users can use wallets saved on their profile
- `REAL_WALLET_REQUIRED` — users must connect a real blockchain wallet
- Admin editor: `/connectadmin/home`

## Layer 2 Config (fetched from `GET /api/config/public`)

| Field | Path | Type |
|-------|------|------|
| Connect behavior | `config/homepage.connectBehavior` | string |
| Badge visibility | `config/homepage.connectBehaviorBadgeVisible` | boolean |
| CTA visibility | `config/homepage.ctaVisibility.campaign` | boolean |
| Task names | `config/homepage.taskNames` | object |
| Task URLs | `config/homepage.taskUrls` | object |
| Task MXP | `config/homepage.taskMxp` | object |
| Status names | `config/homepage.statusNames` | object |
| Status levels | `config/homepage.statusLevels` | object |
| Step titles | `config/homepage.stepTitles` | object |
| Button labels | `config/homepage.buttonLabels` | object |
| Balance labels | `config/homepage.balanceLabels` | object |
| QT options | `config/homepage.qtOptions` | string[] |
| Banner image | `config/homepage.bannerImage` | string |
| MXP rewards | `config/homepage.mxpRewards` | object |

Cached in localStorage (behavior + CTA only) for repeat visits.

## Task Key Mapping

| Homepage ID | Config Key |
|------------|-----------|
| t1 | task1 |
| t2 | task2 |
| t3 | task3 |
| t4 | task4 |
| t_qt3 (Step 5) | task5 |
| telegram | telegram |

## Layer 1 Constants (in `src/lib/site-config.ts`)

See `site-config.ts` for all default values. These are the fallback values used when no Layer 2 config has been saved. The admin panel can override all of them.

## Admin Control Model

**Homepage connect behavior** — `/connectadmin/home`
**CTA visibility** (campaign) — `/connectadmin/home`
**Page availability** (campaign) — `/connectadmin/home`
**Balance labels** — `/connectadmin/home`
**Task editor** — `/connectadmin/home`
**Status editor** — `/connectadmin/home`
**Referral settings** — `/connectadmin/home`
**Step titles / button labels / QT templates** — `/connectadmin/home`

## Files Involved

| File | Layer | Role |
|------|-------|------|
| `src/app/page.tsx` | 1+2 | Homepage UI + config fetch |
| `src/app/checknfts/page.tsx` | 1+2 | Near-duplicate (to be merged) |
| `src/lib/site-config.ts` | 1 | Brand constants + Layer 2 defaults |
| `src/lib/api.ts` | 1+2 | HTTP client (to be split) |
| `src/app/api/config/public/route.ts` | 2 | Public config endpoint |
| `src/app/api/user/register/route.ts` | 3 | User registration endpoint |
| `src/components/Task.tsx` | 1 | Task card component |
| `src/components/Step.tsx` | 1 | Step wrapper component |
