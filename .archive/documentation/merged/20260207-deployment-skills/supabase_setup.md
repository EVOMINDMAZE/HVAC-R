---
name: Supabase Edge Functions Setup Guide
description: The initial authentication flow suffered from session persistence issues after page reloads. We have shifted to a robust localStorage only strategy...
version: 1.0
---

# Supabase Edge Functions Setup Guide

The initial authentication flow suffered from session persistence issues after page reloads. We have shifted to a robust `localStorage` only strategy for the Supabase client.

## Step 0: Session Persistence Logic (Crucial for Mobile)

The `client/lib/supabase.ts` initialization MUST use:
```typescript
auth: {
  persistSession: true,
  storageKey: 'supabase.auth.token',
  storage: window.localStorage,
  detectSessionInUrl: true,
  autoRefreshToken: true
}
```
**Avoid** using `sessionStorage` or custom caching wrappers, as these cause null sessions during browser reloads or PWA refreshes.

## Step 0.5: Shared Logic Pattern

We use a `_shared` folder for common logic (e.g., Email Templates) across multiple functions. To use this in a function:

1.  Place code in `supabase/functions/_shared/filename.ts`.
2.  Import via relative path: `import { ... } from '../_shared/filename.ts'`.
3.  Deploy normally; Supabase CLI automatically bundles the shared dependency.

## Local Docker Development Setup

### Prerequisites
- Docker installed and running
- Supabase CLI: `npm install -g supabase`

### Step 1: Start Local Supabase
```bash
supabase start
```
This starts local Docker containers for database, auth, storage, and Studio.

### Step 2: Configure Local Environment Variables
Update your `.env` file for local development:
```bash
# Local Docker development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

### Step 3: Develop Locally
- Access local database via `localhost:54322`
- Access Supabase Studio via `localhost:54323`
- Develop and test with local Docker instance

### Step 4: Create Migrations
Add SQL migration files to `supabase/migrations/` for schema changes.

## Cloud Project Deployment

### Step 5: Link to Cloud Project
```bash
# Login to Supabase
supabase login

# Link your existing project
supabase link --project-ref rxqflxmzsqhqrzffcsej
```

### Step 6: Apply Database Changes to Cloud
Push your local migrations to the cloud database:
```bash
# Push migrations to the live database
supabase db push
```

### Step 7: Deploy Edge Functions
```bash
# Deploy the core AI functions
supabase functions deploy ai-gateway ai-troubleshoot analyze-triage-media

# Deploy business automations
supabase functions deploy review-hunter invoice-chaser webhook-dispatcher invite-user
```

### Step 8: Set Environment Variables in Supabase

**Database Password**: `TddR7OpEdrkbbwOE`

Go to your Supabase project dashboard → Settings → Environment Variables and add:

#### Required Variables:
- `STRIPE_SECRET_KEY` = `sk_test_...` (your Stripe secret key)
- `STRIPE_WEBHOOK_SECRET` = `whsec_...` (your Stripe webhook secret)
- `RESEND_API_KEY` = `re_...` (your Resend API key for emails)
- `CLIENT_URL` = `https://your-app.netlify.app` (Your production Netlify URL)

#### Stripe Price IDs (copy from your current config):
- `VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID`
- `VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID`
- `VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
- `VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID`

#### AI Gateway Configuration
We have standardized on an **AI Gateway** pattern to centralize model management and provider abstraction.

Add these Edge Function secrets in Supabase (Settings → Environment Variables → Edge Function Secrets):
- `XAI_API_KEY` – For Grok-2 and Grok-2 Vision (Triage & Warranty).
- `DEEPSEEK_API_KEY` – For DeepSeek-Reasoner (General Reasoning & Physics).
- `GROQ_API_KEY` – For Llama-3 (Fast Fallback).

All functions (e.g., `ai-troubleshoot`) now call `ai-gateway` internally.

After updating secrets, redeploy the function: `supabase functions deploy ai-troubleshoot`.

#### SMS Integration (Telnyx)
Add these Edge Function secrets for SMS notifications:
- `TELNYX_API_KEY` – Your Telnyx API key from the dashboard
- `TELNYX_FROM_NUMBER` – Your Telnyx phone number in E.164 format (e.g., `+15551234567`)

> [!NOTE]
> **Development Mode**: If `TELNYX_API_KEY` is not set, SMS functions run in mock mode and only log messages to the console without actual delivery.

After updating secrets, redeploy affected functions: `supabase functions deploy webhook-dispatcher review-hunter invoice-chaser`.

#### Stripe Payment & Provisioning
We use two primary handlers for Stripe:
1.  **`stripe-webhook`**: **CRITICAL/PROD**. Handles `checkout.session.completed` to provision new companies, licenses, and send welcome emails.
2.  **`billing`**: Handles direct subscription management and plan upgrades.

In your Stripe dashboard, set your webhook endpoint to:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

## Step 9: Test the Integration

After deployment, test by:

1. Sign in to your app
2. Try to upgrade a plan
3. Check the browser console for any remaining errors

## Development Workflow Summary

1. **Local Development**: Use `supabase start` for Docker-based local development
2. **Testing**: Test changes locally with `localhost:54321`
3. **Migrations**: Create SQL files in `supabase/migrations/`
4. **Cloud Deployment**: Push changes with `supabase db push`
5. **Functions**: Deploy edge functions with `supabase functions deploy`

## Troubleshooting

### If you get "Supabase is not configured" error:
- Make sure `VITE_SUPABASE_URL` is set correctly in your environment
- Redeploy your frontend after updating the environment variables

### If you get 404 errors:
- Make sure the Edge Function is deployed: `supabase functions list`
- Check that all environment variables are set in Supabase dashboard

### If you get Stripe errors:
- Verify your Stripe keys are correct
- Make sure webhook secret matches between Stripe and Supabase
- Check that price IDs are valid in your Stripe dashboard

## What This Does

Once configured, the billing flow will work as follows:

1. User clicks "Upgrade" button
2. Frontend calls Supabase Edge Function
3. Edge Function creates Stripe checkout session
4. User is redirected to Stripe checkout
5. After payment, user is redirected back to your app
6. Webhook updates subscription status

## Benefits of Supabase Edge Functions vs Netlify:

- ✅ Better integration with Supabase auth
- ✅ Faster performance (edge computing)
- ✅ Unified platform (auth + functions)
- ✅ Better security and CORS handling
- ✅ Easier deployment and management

## RLS & Technician Visibility Best Practices

To ensure Technicians see only their assigned jobs WITHOUT recursive policy errors:

1. **Non-Recursive Membership Check**: Use `get_my_company_id()` which is defined as `SECURITY DEFINER` to bypass recursion.
2. **Standardized Role Check**: Use `get_my_role()` to enforce RBAC in `USING` clauses.
3. **Role-Based Policies**:
   - `SELECT` (Jobs): `(auth.uid() = technician_id) OR (get_my_role() IN ('admin', 'manager'))`
4. **Metadata Isolation**: Use `get_my_company_metadata()` to allow non-owners to safely fetch branding without granting direct access to the `companies` table.