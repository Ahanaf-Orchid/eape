# Todo List

**Last updated:** 2026-06-10

## Done — Phase 11: 3-Layer Architecture Restructuring

- [x] Write `docs/ARCHITECTURE.md` with full 3-layer spec
- [x] Create all dedicated API endpoints (config/public, user/register, campaign/complete-task, form/*, admin/*)
- [x] Create `src/lib/admin-auth.ts` (session tokens, requireAdmin)
- [x] Create `src/lib/rate-limit.ts` (IP-based, register + complete-task)
- [x] Deprecate old `/api/data/[path]` with X-Deprecated header
- [x] Expand `src/lib/site-config.ts` with all Layer 2 defaults (~501 lines)
- [x] Merge `src/lib/nft-config.ts` re-exports from site-config
- [x] Rewrite homepage registration to atomic `POST /api/user/register`
- [x] Apply atomic registration to checknfts/page.tsx
- [x] Rewrite `connectadmin/page.tsx` (999→150 lines, adminApi(token))
- [x] Rewrite `connectadmin/home/page.tsx` (858→340 lines, Frontend/Backend tabs)
- [x] Migrate `connectadmin/campaign`, `connectadmin/verify`, `connectadmin/holders` to adminApi(token)
- [x] Rewrite `connectadmin/images/page.tsx` with file upload + 2-col grid
- [x] Create `POST /api/admin/upload` (multipart, saves to public/uploads/)
- [x] Delete `connectadmin/mode/page.tsx` (dead stub)
- [x] Wire images to homepage + checknfts (brandImages, homeImages, balanceIcons)
- [x] Wire checknfts sale phases to config (nftLeftImages, nftRightImages, calendarIcon, durationIcon)
- [x] Fix nested images loading bug (imagesData outside if(data) block)
- [x] Wire `logoSrc` to Task component (from balanceIcons)
- [x] Add `nftImages` prop to NFTGallery component
- [x] Fix favicon live-update via `generateMetadata()` + `updatedAt` cache-busting
- [x] Mobile profile card CSS fix (@media max-width: 480px)
- [x] Mobile column order (banner top, user middle, status bottom)
- [x] Banner rotation (homeImages array + homeDurations + timeout)
- [x] HomeButtons wiring from admin config to buttonLabels
- [x] Username display formatting (strip @, capitalize)
- [x] Verified badge split (✓ row 1, Verified row 2 on mobile)

## Pending

- [ ] Populate `public/shared/` with SVG files (icon-top-1/2/3, thumb-1-5, mint-logo)
- [ ] Remove `/api/submit/[type]` (moved to form/* endpoints)
- [ ] Clean stale CSS (`.mint-*`, `.buy-*` from globals.css)
- [ ] Create GitHub org repo, push code
- [ ] Deploy to Hostinger KVM 4
- [ ] Wire domain DNS + SSL
- [ ] Post-deploy verification
