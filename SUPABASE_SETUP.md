# Supabase Edge Functions Setup Guide

## Current Issue
The upgrade buttons are showing an error because Supabase Edge Functions are not yet configured and deployed. Here's how to fix it:

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

## Step 3: Login and Link Project

```bash
# Login to Supabase
supabase login

# Link your existing project
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 4: Deploy the Billing Edge Function

```bash
# Deploy the billing function
supabase functions deploy billing
```

## Step 5: Set Environment Variables in Supabase Dashboard

Go to your Supabase project dashboard → Settings → Environment Variables and add:

### Required Variables:
- `STRIPE_SECRET_KEY` = `sk_test_...` (your Stripe secret key)
- `STRIPE_WEBHOOK_SECRET` = `whsec_...` (your Stripe webhook secret)
- `CLIENT_URL` = `https://173ba54839db44079504686aa5642124-7d4f8c681adb406aa7578b14f.fly.dev`

### Stripe Price IDs (copy from your current config):
- `VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID`
- `VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID` 
- `VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
- `VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID`

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
