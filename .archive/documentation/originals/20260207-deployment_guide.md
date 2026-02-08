# ThermoNeural App Deployment Guide 🚀

This guide covers how to deploy the **Core SaaS Application** (React Frontend + Supabase Backend).

> [!IMPORTANT]
> This guide covers the deployment of the **Core SaaS App** (Supabase + Netlify) and **Edge Functions**.

## 1. Architecture Overview
- **Frontend**: React (Vite) -> Deployed to **Netlify**.
- **Backend**: Supabase (PostgreSQL + Auth + Realtime).
- **Logic**: Supabase Edge Functions (Deno).
- **AI**: Supabase Edge Functions call External APIs (OpenAI, DeepSeek, XAI).

## 2. Prerequisites
- [x] Supabase Project created (Cloud).
- [x] Netlify Account created.
- [x] GitHub Repository connected.

## 3. Deployment Steps

### A. Database & Edge Functions (Supabase)
1.  **Link Project**:
    ```bash
    supabase login
    supabase link --project-ref rxqflxmzsqhqrzffcsej
    ```
2.  **Push Migrations** (Schema changes):
    ```bash
    supabase db push
    ```
3.  **Deploy Edge Functions** (API Logic):
    ```bash
    supabase functions deploy billing
    supabase functions deploy ai-troubleshoot
    supabase functions deploy analyze-triage-media
    supabase functions deploy webhook-dispatcher
    supabase functions deploy review-hunter
    ```
4.  **Set Secrets**:
    Ensure `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, etc., are set in Supabase Dashboard > Settings > Edge Functions.

### B. Frontend (Netlify)
1.  **Connect Repo**:
    - Go to Netlify > "Add new site" > "Import from an existing project".
    - Select your GitHub repo.
2.  **Build Settings**:
    - **Base directory**: `client` (or root if package.json is in root - currently root).
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
3.  **Environment Variables (Netlify)**:
    Add these in Site Settings > Environment variables:
    - `VITE_SUPABASE_URL`: `https://rxqflxmzsqhqrzffcsej.supabase.co`
    - `VITE_SUPABASE_ANON_KEY`: `[YOUR_PUBLIC_ANON_KEY]`
    - `VITE_API_BASE_URL`: `https://rxqflxmzsqhqrzffcsej.supabase.co/functions/v1` (Points to Edge Functions).

## 4. Verification
- **Build Status**: Check Netlify "Deploys" tab.
- **Health Check**: Open the App URL.
- **Function Check**: Try to "Upgrade" (hits `billing` function) or use "AI Chat" (hits `ai-troubleshoot`).

## 5. Troubleshooting
- **"Vite manifest not found"**: Ensure `npm run build` ran successfully.
- **CORS Errors**: Check Supabase Dashboard > Authentication > URL Configuration > Site URL (Must match Netlify URL).
## 6. Critical Operational Notes

### A. PWA Session Persistence
> [!CAUTION]
> Ensure the Supabase client initialization in `client/lib/supabase.ts` remains set to `localStorage`. Using `sessionStorage` will cause technicians to be logged out whenever the PWA is refreshed or minimized on mobile.

### B. E2E Verification
To verify a deployment locally before pushing:
```bash
npm run test:e2e
```
This uses the headless configuration in `playwright.config.ts` optimized for CI environment stability.
