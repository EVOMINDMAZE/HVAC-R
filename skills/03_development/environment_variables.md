---
name: Environment Variables Reference
description: Complete reference for all environment variables used in ThermoNeural.
version: 1.0
---

# Environment Variables Reference

Complete reference for all environment variables used in ThermoNeural.

## Quick Setup

```bash
# Interactive wizard (recommended)
./scripts/setup-env.sh

# Or copy template
cp .env.template .env
```

## Variable Categories

### 1. Supabase (Required)

| Variable                    | Type   | Description                    | Where Used      |
| --------------------------- | ------ | ------------------------------ | --------------- |
| `VITE_SUPABASE_URL`         | Public | Supabase project URL           | Client, Server  |
| `VITE_SUPABASE_ANON_KEY`    | Public | Supabase anon/public key       | Client, Server  |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Service role key (full access) | Server only     |
| `SUPABASE_DB_PASSWORD`      | Secret | Database password              | Migrations only |

**Where to find:**

- Supabase Dashboard > Project Settings > API

**Example:**

```env
VITE_SUPABASE_URL=https://rxqflxmzsqhqrzffcsej.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=your-password
```

### 2. Stripe (Required for Payments)

| Variable                       | Type   | Description              | Where Used             |
| ------------------------------ | ------ | ------------------------ | ---------------------- |
| `VITE_STRIPE_PUBLISHABLE_KEY`  | Public | Stripe publishable key   | Client                 |
| `STRIPE_SECRET_KEY`            | Secret | Stripe secret key        | Server, Edge Functions |
| `STRIPE_WEBHOOK_SECRET`        | Secret | Webhook signing secret   | Edge Functions         |
| `VITE_STRIPE_PRICE_PRO`        | Public | Pro plan price ID        | Client                 |
| `VITE_STRIPE_PRICE_ENTERPRISE` | Public | Enterprise plan price ID | Client                 |

**Where to find:**

- Stripe Dashboard > Developers > API keys
- Stripe Dashboard > Developers > Webhooks

**Example:**

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PRICE_PRO=price_1...
VITE_STRIPE_PRICE_ENTERPRISE=price_1...
```

### 3. Render (Calculation Service)

| Variable                 | Type   | Description             | Where Used     |
| ------------------------ | ------ | ----------------------- | -------------- |
| `RENDER_SERVICE_URL`     | Public | Calculation service URL | Client, Server |
| `RENDER_DEPLOY_HOOK_URL` | Secret | Deploy hook for CI/CD   | GitHub Actions |

**Where to find:**

- Render Dashboard > Service > Settings

**Example:**

```env
RENDER_SERVICE_URL=https://hvacr-calc.onrender.com
RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-...
```

### 4. Netlify (Frontend Hosting)

| Variable             | Type   | Description             | Where Used |
| -------------------- | ------ | ----------------------- | ---------- |
| `NETLIFY_SITE_ID`    | Public | Netlify site identifier | CI/CD      |
| `NETLIFY_AUTH_TOKEN` | Secret | Personal access token   | CI/CD      |

**Where to find:**

- Netlify Dashboard > Site Settings > General
- Netlify User Settings > Applications > Personal access tokens

**Example:**

```env
NETLIFY_SITE_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
NETLIFY_AUTH_TOKEN=nfp_...
```

### 5. AI Services (Edge Functions)

These are set as **Supabase Edge Function Secrets**, not in `.env`:

| Variable           | Provider | Purpose                       |
| ------------------ | -------- | ----------------------------- |
| `XAI_API_KEY`      | xAI      | Grok Vision (triage analysis) |
| `DEEPSEEK_API_KEY` | DeepSeek | Reasoning (troubleshooting)   |
| `GROQ_API_KEY`     | Groq     | Fast LLM (chat)               |
| `OPENAI_API_KEY`   | OpenAI   | GPT fallback                  |

**Where to set:**

- Supabase Dashboard > Edge Functions > Secrets

### 6. Communication Services (Edge Functions)

| Variable            | Provider | Purpose        |
| ------------------- | -------- | -------------- |
| `RESEND_API_KEY`    | Resend   | Email delivery |
| `TELNYX_API_KEY`    | Telnyx   | SMS delivery   |
| `TELNYX_PUBLIC_KEY` | Telnyx   | SMS public key |

**Where to set:**

- Supabase Dashboard > Edge Functions > Secrets

### 7. Node Environment

| Variable   | Values                              | Description         |
| ---------- | ----------------------------------- | ------------------- |
| `NODE_ENV` | `development`, `production`, `test` | Runtime environment |

## Environment-Specific Configuration

### Local Development (.env)

```env
NODE_ENV=development
VITE_SUPABASE_URL=https://rxqflxmzsqhqrzffcsej.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### GitHub Actions (Secrets)

Add in: Settings > Secrets and variables > Actions

Required:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

### Netlify (Environment Variables)

Add in: Site Settings > Environment variables

Required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_PRO`
- `VITE_STRIPE_PRICE_ENTERPRISE`

### Render (Environment)

Add in: Service > Environment

Required:

- `NODE_ENV=production`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Edge Functions (Secrets)

Add in: Edge Functions > Secrets

Required:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `XAI_API_KEY`
- `DEEPSEEK_API_KEY`
- `RESEND_API_KEY`
- `TELNYX_API_KEY`

## Security Best Practices

### 1. Never Commit Secrets

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

### 2. Use VITE\_ Prefix for Client Variables

Only variables prefixed with `VITE_` are exposed to the client:

```env
# Exposed to client (safe)
VITE_SUPABASE_URL=https://...

# Server-only (secret)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Rotate Keys Regularly

| Key Type           | Rotation Frequency |
| ------------------ | ------------------ |
| API Keys           | Every 90 days      |
| Webhook Secrets    | After incidents    |
| Database Passwords | Every 6 months     |

### 4. Use Different Keys per Environment

```env
# Development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Troubleshooting

### Variable Not Found

```bash
# Check if variable is loaded
echo $VITE_SUPABASE_URL

# Verify .env file
cat .env | grep VITE_SUPABASE_URL
```

### Vite Not Loading Variables

- Restart dev server after changing `.env`
- Ensure variable starts with `VITE_`
- Check for typos

### Edge Function Secret Not Working

1. Verify secret is set in Supabase Dashboard
2. Redeploy the function:

   ```bash
   supabase functions deploy <function-name>
   ```

3. Check function logs for errors

### GitHub Actions Secret Not Found

1. Verify secret name matches exactly (case-sensitive)
2. Check secret is in correct repository
3. Verify workflow has permission to access secrets
