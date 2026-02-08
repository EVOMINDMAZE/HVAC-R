---
name: Rebranding Verification Guide
description: The application has been fully rebranded from "Simulateon" to ThermoNeural. The new design vision ("Notion meets Stripe") features a clean Slate an...
version: 1.0
---

# Rebranding Verification Guide

The application has been fully rebranded from "Simulateon" to **ThermoNeural**. The new design vision ("Notion meets Stripe") features a clean **Slate** and **Orange** color palette, replacing the previous Blue/Teal theme.

## 1. Visual Inspection Checklist

Please verify the following pages to ensure the new branding is consistent:

### Landing Page (`/`)

- [ ] **Header**: Logo and Title should read "ThermoNeural". Colors should be Slate/Orange.
- [ ] **Hero Section**: Background should be warm/neutral (Orange/Red/Slate) instead of Cool Blue/Purple.
- [ ] **Feature Cards**: Should use Slate/Orange/Red accents.
- [ ] **Footer**: "ThermoNeural" branding, `support@thermoneural.com`, and dark slate background.

### A2L Landing Page (`/calculators/a2l-refrigerant-charge`)

- [ ] **Overall Theme**: Clean Slate background.
- [ ] **Testimonials**: Slate/Gray styling (no blue backgrounds).

### Authentication (`/signin`, `/signup`)

- [ ] **Logo**: ThermoNeural (Orange Icon).
- [ ] **Buttons**: Primary buttons should be Dark Slate (Black). Focus rings should be Orange.
- [ ] **Links**: "Start Free Trial" etc. should align with the new palette.

### Dashboard (Login to view)

- [ ] **Header**: Dark Slate/Orange gradient for the logo container.
- [ ] **Sidebar**: Navigation items should use Slate colors (Dark Text on hover/active), not Blue.
- [ ] **Search Bar**: Focus ring should be Orange.

## 2. Code Changes Summary

- **`client/global.css`**: Updated CSS variables for the ThermoNeural palette.
- **`client/components/Header.tsx`**: Updated logo, title, and color classes for both Landing and Dashboard variants.
- **`client/components/Sidebar.tsx`**: Updated active states and icon colors.
- **`client/components/Footer.tsx`**: Updated brand name, links, and background gradients.
- **`client/pages/Landing.tsx`**: Overhauled hero visuals and feature sections.
- **`client/pages/SignIn.tsx` & `SignUp.tsx`**: Updated auth page branding.
- **`index.html`**: Updated page title.

## 3. Running the App

```bash
npm run dev
```

Visit `http://localhost:5173` to see the changes.
