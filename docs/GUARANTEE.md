# The ThermoNeural Guarantee — Single-Source Copy Spec

> **RULE:** The copy below is the ONLY approved wording. Do not paraphrase, shorten,
> or localize differently per product. Ship it verbatim everywhere. If a change is
> needed, change it HERE first, then propagate to all 4 products in the same commit wave.

## 1. Footer strip (all 4 products) — verbatim

> **The ThermoNeural Guarantee:** your data is yours — export everything, cancel anytime, 30-day money-back.

- Component: `GuaranteeStrip` (Box: `client/components/GuaranteeStrip.tsx`).
- Placement: every site footer, directly above the copyright bar.
- Link target:
  - The Box (thermoneural.com): `/terms#guarantee` (internal).
  - PhasePoint / VanClass / Cryovo: `https://thermoneural.com/terms#guarantee` (canonical source of truth).
- Visual: shield icon (lucide `ShieldCheck`), single accent color, NO rainbow, NO gradient.

## 2. Terms section `/terms#guarantee` (The Box) — verbatim

### The ThermoNeural Guarantee

**1. Your data is yours.** Everything you build in a ThermoNeural product can be
exported in open formats — CSV and PDF — with one click. If you cancel, your account
continues on the Free plan and nothing you created is deleted.

**2. Cancel anytime.** You can manage or cancel your subscription yourself, from your
profile, in one place. No phone calls, no emails, no retention scripts. Cancellation
takes effect at the end of your current billing period.

**3. 30-day money-back.** If your first invoice on any paid plan doesn't earn its
keep, email support@thermoneural.com within 30 days of payment for a full refund.
No forms, no interrogation.

## 3. Footer legal links (The Box)

Add a third link next to Privacy / Terms: **Guarantee** → `/terms#guarantee`.

## 4. Factual backing (verified 2026-09-03 — do not weaken or overstate)

| Clause | Evidence |
|---|---|
| Data export | `client/components/ProfessionalFeatures.tsx` builds + downloads CSV reports; PDF report path exists. |
| Self-serve cancel | `Profile.tsx` → `openCustomerPortal()` → billing fn `create-portal-session` → Stripe portal (cancel at period end). |
| Data survives cancel | billing webhook only updates `subscription_status`; no delete path exists; free tier access verified (pp-test QA account). |
| 30-day refund | Business policy committed by sponsor (Riad) as part of the Boucicaut ship-list — supported manually via support@. |

## 5. Rollout checklist

- [ ] The Box (thermoneural.com): strip in `Footer` + `UmbrellaFooter`, Terms section, footer link.
- [ ] PhasePoint (simulateon.vercel.app): strip in footer → canonical URL.
- [ ] VanClass (vanclass-app.vercel.app): strip in footer → canonical URL.
- [ ] Cryovo (cryovo.vercel.app): strip in footer → canonical URL.
- [ ] Live probe all 4 domains (Playwright, screenshot evidence).
