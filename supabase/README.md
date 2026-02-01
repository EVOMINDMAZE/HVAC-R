# Supabase Edge Functions Deployment

This directory contains the Supabase Edge Functions that handle billing operations for the Simulateon app.

## Functions

### billing

Handles all Stripe billing operations:

- Create checkout sessions
- Create customer portal sessions
- Get subscription details
- Handle webhooks

## Deployment

1. Install the Supabase CLI:

```bash
npm install -g supabase
```

2. Login to Supabase:

```bash
supabase login
```

3. Link your project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Deploy the billing function:

```bash
supabase functions deploy billing
```

## Environment Variables

Set these environment variables in your Supabase project dashboard:

### Required for Stripe Integration:

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `CLIENT_URL` - Your frontend URL (for redirects)

### Pricing Configuration:

- `VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID`
- `VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID`
- `VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
- `VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID`

## Webhook Configuration

Configure your Stripe webhook to point to:

```
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/billing/webhook
```

## Testing

To test the functions, you can invoke them against your deployed Supabase project:

```bash
# Example: Invoke via curl against the remote project
curl -i --location --request POST 'https://rxqflxmzsqhqrzffcsej.supabase.co/functions/v1/billing/test' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Functions"}'
```

Ensure your client application is running and pointed to the same Cloud project.

