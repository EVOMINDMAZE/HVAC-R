# Funnel Performance & Accessibility QA

Status: partial-pass (runtime UX checks pass; Lighthouse score capture pending)

## Targets
- Pages: `/`, `/features`, `/pricing`
- Viewports: 1440x900, 1280x800, 390x844

## Checks
- [ ] Lighthouse (Performance, Accessibility, Best Practices, SEO) desktop + mobile.
- [x] prefers-reduced-motion respected (no non-essential motion).
- [x] Keyboard nav order + focus-visible support in landing shell controls.
- [x] Contrast pass for hero text, chips, muted text, buttons (manual token-level review).
- [x] No clipping/overflow at target viewports; sticky mobile CTA does not cover key CTAs.
- [x] CLS-like stability during hero/media load (static assets + no internal hero scroll).
- [x] Automated UX smoke run completed after SPA-safe wait updates.

## Evidence
- Added reduced-motion fallback in `client/landing.css`.
- Framer transitions in `client/pages/Landing.tsx` now collapse to zero-duration when reduced motion is enabled.
- Build/check baseline still green after changes:
  - `npm run typecheck` pass
  - `npm run test` pass
  - `npm run build:client` pass

## Notes / Actions
- Run `npx lighthouse http://localhost:8090 --preset=desktop` (and mobile).
- Manually tab through hero → nav → tool toggle → pricing CTAs → footer.
- Log findings and fixes here as checkboxes.
- Lighthouse package is not installed locally and network is restricted (`NOT_INSTALLED` + DNS failures), so score capture is pending environment access.
