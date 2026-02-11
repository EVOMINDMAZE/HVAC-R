# Funnel Performance & Accessibility QA

Status: pending measurements

## Targets
- Pages: `/`, `/features`, `/pricing`
- Viewports: 1440x900, 1280x800, 390x844

## Checks
- [ ] Lighthouse (Performance, Accessibility, Best Practices, SEO) desktop + mobile.
- [ ] prefers-reduced-motion respected (no non-essential motion).
- [ ] Keyboard nav order + focus rings on all CTAs, nav, inventory toggle, pricing CTAs, footer links.
- [ ] Contrast pass for hero text, chips, muted text, buttons.
- [ ] No clipping/overflow at target viewports; sticky mobile CTA doesn’t cover content/footer.
- [ ] CLS-like stability during hero/media load.

## Notes / Actions
- Run `npx lighthouse http://localhost:8090 --preset=desktop` (and mobile).
- Manually tab through hero → nav → tool toggle → pricing CTAs → footer.
- Log findings and fixes here as checkboxes.
