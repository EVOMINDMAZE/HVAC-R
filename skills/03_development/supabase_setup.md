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

## Step 1: Configure Supabase Environment Variables

Update your `.env` file or use DevServerControl to set these variables:

```bash
# Replace with your actual Supabase project URL
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Replace with your actual Supabase anon key
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 2: Install Supabase CLI

```bash
npm install -g supabase
```

## Step 3: Link Project (Cloud-First)

We do not use local Docker. Connect directly to the cloud project:

```bash
# Login to Supabase
supabase login

# Link your existing project
supabase link --project-ref rxqflxmzsqhqrzffcsej
```

## Step 4: Apply Database Changes

Since we don't use local Docker, we apply changes directly to the cloud:

```bash
# Push migrations to the live database
supabase db push
```

## Step 5: Deploy Edge Functions

```bash
# Deploy the billing function
supabase functions deploy billing

# Deploy the AI troubleshooting function
supabase functions deploy ai-troubleshoot
```

## Step 6: Set Environment Variables in Supabase

**Database Password**: `TddR7OpEdrkbbwOE`

Go to your Supabase project dashboard → Settings → Environment Variables and add:

### Required Variables:

- `STRIPE_SECRET_KEY` = `sk_test_...` (your Stripe secret key)
- `STRIPE_WEBHOOK_SECRET` = `whsec_...` (your Stripe webhook secret)
- `CLIENT_URL` = `https://your-app.netlify.app` (Your production Netlify URL)

### Stripe Price IDs (copy from your current config):

- `VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID`
- `VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID`
- `VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
- `VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID`

### AI / Ollama Configuration

Add these Edge Function secrets in Supabase (Settings → Environment Variables → Edge Function Secrets or via `supabase secrets set`):

- `OLLAMA_BASE_URL` – Base URL of your Ollama deployment (e.g. `https://ollama.example.com`). Do not include a trailing slash.
- `OLLAMA_API_KEY` – Optional Bearer token if your Ollama endpoint requires authentication.
- `OLLAMA_MODEL` _(optional)_ – Default model name (defaults to `llama3`).
- `OLLAMA_TIMEOUT_MS` _(optional)_ – Request timeout in milliseconds (defaults to `30000`).

After updating secrets, redeploy the AI function: `supabase functions deploy ai-troubleshoot`.

## Step 6: Update Stripe Webhook URL

In your Stripe dashboard, update your webhook endpoint to:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/billing/webhook
```

## Step 7: Test the Integration

After deployment, test by:

1. Sign in to your app
2. Try to upgrade a plan
3. Check the browser console for any remaining errors

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

1. **Non-Recursive Membership Check**: Use a simple look-up or join, avoid calling functions that query the same table.
2. **Role-Based Policies**:
   - `SELECT`: `(auth.uid() = technician_id) OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))`
3. **Session Verification**: Ensure the frontend `useSupabaseAuth` hook is initialized before fetching RLS-protected data to avoid 400 errors.
