---
name: Business in a Box Model
description: Codifies the "Business in a Box" offer: Community membership includes App and serverless automation access via Supabase Edge Functions.
---

# Business in a Box Model

This skill defines the core product offering. The "App" is just one tool in the Member's toolbox.

> **Architecture Split**:
>
> 1. **App**: Shared SaaS (Supabase Cloud + Netlify).
> 2. **Heavy Calcs**: Python/Go Engine on **Render**.
> 3. **Automation**: Native Edge Functions on **Supabase** (Serverless).

## 1. The Offer Bundle

- **Primary Product**: Monthly Subscription to the **Community**.
- **Price**: ~$199/month (Platform: Skool).
- **Included Assets**:
  1.  **Community Access**: Discussion, learning, networking.
  2.  **HVAC-R Pro App**: White-labeled usage for the Member to run their business.
      - _Includes_: Professional Reporting (PDF Export), Saved History, and Advanced Calculations.
  3.  **Automation Engine**: Zero-setup, serverless automations that handle "Busy Work" instantly.
      - **Review Hunter**: Automatically requests reviews after jobs.
      - **Invoice Chaser**: Automatically follows up on overdue payments.

## 2. The Member Persona (Owner)

The user of this app is an **HVAC Business Owner** (or aspiring one).

- **Goal**: To serve _their_ residential/commercial clients efficiently.
- **Need**: They need "Tools" (App) + "Systems" (Automations) + "Guidance" (Community).

## 3. Integration Logic

- **Authentication**:
  - Ideally, "Login with Skool" or an invite link sent after Skool checkout.
  - App Role: `Owner`.
- **Automation Provisioning**:
  - **Zero Setup**: Automations are native. No external servers to provision.
  - **Configuration**: The "Settings" page allows enabling/disabling specific workflows (e.g., "Turn on Review Hunter").
  - **Billing**: Usage (Resend/Telnyx) is wrapped into the subscription or billed as usage overages.

## 4. Development Implications

- **No "Freemium" App**: The App is a paid benefit of the Community. Access is binary (Member vs Non-Member).
- **White Labeling**: The App needs to look like _the Member's_ business to _their_ clients.
  - _Feature_: "Upload Your Logo" (replaces App logo on Client Portal).
  - _Feature_: "Your Company Name" on PDF reports.
