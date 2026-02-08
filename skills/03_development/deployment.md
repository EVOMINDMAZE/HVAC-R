---
name: Comprehensive Deployment Guide 🚀
description: Complete deployment guide for ThermoNeural HVAC-R platform covering Supabase, Netlify, Render, CI/CD, troubleshooting, and best practices.
version: 2.0
---

# Comprehensive Deployment Guide 🚀

## Overview

This guide provides complete deployment instructions for the **ThermoNeural HVAC-R platform**, covering the full stack: **Supabase (Database, Auth, Edge Functions)**, **Netlify (Frontend)**, **Render (Heavy Calculations)**, and **CI/CD pipelines**. Whether you're deploying for the first time or managing ongoing updates, this guide has you covered.

## Architecture Overview

```
GitHub (Source Code)
    |
    +---> Supabase Cloud
    |       - PostgreSQL Database
    |       - Authentication & RLS Policies
    |       - Edge Functions (21 functions)
    |       - Storage & Realtime
    |
    +---> Netlify
    |       - Static SPA Frontend (React/Vite)
    |       - Global CDN
    |       - Automatic HTTPS
    |
    +---> Render
            - Heavy Calculations (Python/FastAPI/CoolProp)
            - Auto-scaling (1-3 instances)
```

### Core Components

- **Frontend**: React (Vite) → Deployed to **Netlify**
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Logic**: Supabase Edge Functions (Deno)
- **AI**: AI Gateway pattern via Edge Functions calling external APIs (xAI/Grok, DeepSeek, Groq)
- **Heavy Compute**: Render Python service for thermodynamic calculations

## Prerequisites

### Accounts Required

- [x] **Supabase Project** created (Cloud)
- [x] **Netlify Account** created
- [x] **Render Account** created (for calculation service)
- [x] **GitHub Repository** connected

### Tools Required

```bash
# Node.js (v18+)
node --version

# Supabase CLI
npm install -g supabase
supabase --version

# Netlify CLI (optional)
npm install -g netlify-cli
netlify --version
```

### Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:

- **Supabase**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Stripe**: `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **AI Providers**: `XAI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY` (for AI Gateway)
- **Email/SMS**: `RESEND_API_KEY`, `TELNYX_API_KEY`, `TELNYX_FROM_NUMBER`

## Quick Start: One-Command Deployment

For rapid deployment, use the automated scripts:

```bash
# Full deployment (recommended)
./scripts/deploy-all.sh

# With options
./scripts/deploy-all.sh --skip-tests    # Skip test suite
./scripts/deploy-all.sh --dry-run       # Preview without executing
./scripts/deploy-all.sh --force         # Skip confirmations
```

### Individual Component Deployment

```bash
# Supabase only (DB + Functions)
./scripts/deploy-supabase.sh

# Frontend only (Netlify)
./scripts/deploy-frontend.sh

# Specific Edge Function
./scripts/deploy-supabase.sh --function ai-gateway
```

## Manual Deployment Steps

### 1. Environment Setup

```bash
# Interactive setup wizard
./scripts/setup-env.sh

# Or copy template manually
cp .env.template .env
# Edit .env with your values
```

### 2. Supabase Setup

#### Local Development with Docker

```bash
# Start local Supabase
supabase start
```

This starts Docker containers for database, auth, storage, and Studio.

Configure local environment:

```bash
# Local Docker development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

#### Session Persistence (Crucial for Mobile)

The `client/lib/supabase.ts` initialization MUST use `localStorage`:

```typescript
auth: {
  persistSession: true,
  storageKey: 'supabase.auth.token',
  storage: window.localStorage,
  detectSessionInUrl: true,
  autoRefreshToken: true
}
```

**Avoid** `sessionStorage` – it causes null sessions during PWA refreshes.

#### Shared Logic Pattern

Common code across Edge Functions lives in `supabase/functions/_shared/`:

```typescript
import { ... } from '../_shared/filename.ts'
```

### 3. Database Migrations

#### Link to Cloud Project

```bash
# Login to Supabase
supabase login

# Link your existing project
supabase link --project-ref rxqflxmzsqhqrzffcsej
```

#### Push Migrations

```bash
# Push schema changes to cloud database
supabase db push
```

### 4. Edge Functions Deployment

#### Deploy Core Functions

```bash
# AI & Business Functions
supabase functions deploy ai-gateway --no-verify-jwt
supabase functions deploy ai-troubleshoot --no-verify-jwt
supabase functions deploy billing --no-verify-jwt
supabase functions deploy analyze-triage-media --no-verify-jwt
supabase functions deploy webhook-dispatcher --no-verify-jwt

# Business Automations
supabase functions deploy review-hunter invoice-chaser invite-user
```

#### Set Environment Variables in Supabase

Go to Supabase Dashboard → Settings → Environment Variables:

**Required Variables:**

- `STRIPE_SECRET_KEY` = `sk_test_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- `RESEND_API_KEY` = `re_...`
- `CLIENT_URL` = `https://your-app.netlify.app`

**AI Gateway Configuration (Edge Function Secrets):**

- `XAI_API_KEY` – For Grok-2 and Grok-2 Vision
- `DEEPSEEK_API_KEY` – For DeepSeek-Reasoner
- `GROQ_API_KEY` – For Llama-3 (fast fallback)

**SMS Integration (Telnyx):**

- `TELNYX_API_KEY` – Telnyx API key
- `TELNYX_FROM_NUMBER` – Telnyx phone number in E.164 format

> **Development Mode**: If `TELNYX_API_KEY` is not set, SMS functions run in mock mode and only log messages.

### 5. Frontend Deployment (Netlify)

#### Connect Repository

1. Go to Netlify → "Add new site" → "Import from an existing project"
2. Select your GitHub repository

#### Build Settings

- **Base directory**: `client` (or root if package.json is in root)
- **Build command**: `npm run build`
- **Publish directory**: `dist`

#### Environment Variables (Netlify)

Add these in Site Settings → Environment variables:

- `VITE_SUPABASE_URL`: `https://rxqflxmzsqhqrzffcsej.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `[YOUR_PUBLIC_ANON_KEY]`
- `VITE_API_BASE_URL`: `https://rxqflxmzsqhqrzffcsej.supabase.co/functions/v1`

#### Manual Deploy via CLI

```bash
# Build
npm run build:client

# Deploy to Netlify
netlify deploy --prod --dir=dist/spa
```

### 6. Render Calculation Service

For detailed deployment of the heavy calculation service, see the [Render Deployment Guide](./render_deployment.md).

**Quick Setup:**

- Connect GitHub repository to Render
- Enable auto-deploy on push to `main`
- Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Monitor via Render Dashboard

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

**On push to `main`:**

1. Runs test suite
2. Deploys database migrations
3. Deploys Edge Functions (parallel)
4. Builds and deploys frontend to Netlify
5. Triggers Render deployment via deploy hook
6. Runs deployment verification

**Manual triggers:** Available in Actions → Deploy ThermoNeural → Run workflow

### Required GitHub Secrets

Add these in Settings → Secrets and variables → Actions:

| Secret                        | Description                    |
| ----------------------------- | ------------------------------ |
| `SUPABASE_ACCESS_TOKEN`       | Supabase personal access token |
| `SUPABASE_DB_PASSWORD`        | Database password              |
| `VITE_SUPABASE_URL`           | Supabase project URL           |
| `VITE_SUPABASE_ANON_KEY`      | Supabase anon key              |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key         |
| `NETLIFY_AUTH_TOKEN`          | Netlify personal access token  |
| `NETLIFY_SITE_ID`             | Netlify site ID                |
| `RENDER_DEPLOY_HOOK_URL`      | Render deploy hook             |
| `RENDER_SERVICE_URL`          | Render service URL (optional)  |

## Deployment Verification

After deployment, verify all services:

```bash
./scripts/verify-deployment.sh

# Verbose output
./scripts/verify-deployment.sh --verbose

# JSON output (for CI)
./scripts/verify-deployment.sh --json
```

### Manual Verification Checklist

1. **Database**
   - [ ] Tables exist (Supabase Dashboard → Table Editor)
   - [ ] RLS policies active (Authentication → Policies)
   - [ ] AI tables present (`ai_learning_patterns`, `diagnostic_outcomes`)

2. **Edge Functions**
   - [ ] All functions deployed (Supabase Dashboard → Edge Functions)
   - [ ] No errors in function logs
   - [ ] Test: `curl https://your-project.supabase.co/functions/v1/ai-gateway`

3. **Frontend**
   - [ ] Site loads (check Netlify URL)
   - [ ] Authentication works
   - [ ] Calculators functional

4. **Render**
   - [ ] Service healthy (Render Dashboard)
   - [ ] API responds: `curl https://your-service.onrender.com/health`

## Rollback Procedures

### Database Rollback

```bash
# List migrations
supabase migration list

# Create a rollback migration manually
# No automatic rollback - plan carefully!
```

### Frontend Rollback

```bash
# Via Netlify CLI
netlify rollback

# Or via Dashboard: Deploys → Select previous deploy → Publish deploy
```

### Edge Functions Rollback

Re-deploy the previous version from Git:

```bash
git checkout <previous-commit>
./scripts/deploy-supabase.sh --functions-only
git checkout main
```

## Troubleshooting

### Common Issues

**"Supabase CLI not authenticated"**

```bash
supabase login
```

**"Netlify not linked"**

```bash
netlify link
```

**"Edge Function deployment failed"**

```bash
# Check function logs
supabase functions logs <function-name>

# Deploy with verbose output
supabase functions deploy <name> --debug
```

**"Database migration failed"**

```bash
# Check migration status
supabase db diff

# Reset and retry (CAUTION: destroys data)
supabase db reset
```

**"Vite manifest not found"**

- Ensure `npm run build` ran successfully

**"CORS Errors"**

- Check Supabase Dashboard → Authentication → URL Configuration → Site URL (must match Netlify URL)

**"Supabase is not configured" error**

- Make sure `VITE_SUPABASE_URL` is set correctly
- Redeploy frontend after updating environment variables

**"Stripe errors"**

- Verify Stripe keys are correct
- Ensure webhook secret matches between Stripe and Supabase
- Check that price IDs are valid in Stripe dashboard

## Best Practices

### 1. Always Run Tests Before Deploying

```bash
npm run typecheck && npm run test
```

### 2. Use Preview Deployments for Testing

```bash
./scripts/deploy-frontend.sh --preview
```

### 3. Deploy Database Migrations Before Functions

Functions may depend on new tables/columns.

### 4. Monitor After Deployment

- Check Supabase Edge Function logs
- Check Netlify function logs
- Check Render service metrics

### 5. Keep Secrets Secure

- Never commit `.env` to Git
- Use GitHub Secrets for CI/CD
- Rotate keys periodically

### 6. RLS & Technician Visibility

To ensure Technicians see only their assigned jobs WITHOUT recursive policy errors:

1. **Non-Recursive Membership Check**: Use `get_my_company_id()` (defined as `SECURITY DEFINER`)
2. **Standardized Role Check**: Use `get_my_role()` in `USING` clauses
3. **Role-Based Policies**: Example for Jobs table:

   ```sql
   (auth.uid() = technician_id) OR (get_my_role() IN ('admin', 'manager'))
   ```

4. **Metadata Isolation**: Use `get_my_company_metadata()` for safe branding access

## Related Guides

- [Render Deployment Guide](./render_deployment.md) – Detailed Render calculation service setup
- [Developer Guide](../03_development/developer_guide.md) – Comprehensive development documentation
- [AI Agents & Protocols](../04_ai/agents.md) – AI agent standards and protocols
- [Production Checklist](../../docs/production-checklist.md) – Production readiness verification

---

**Deployment Status Dashboard**: Monitor all services via respective dashboards (Supabase, Netlify, Render).

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or reach out to the development team.
