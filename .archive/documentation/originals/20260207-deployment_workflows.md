# Deployment Workflows

This document provides step-by-step instructions for deploying ThermoNeural to production.

## Architecture Overview

```
GitHub (Source Code)
    |
    +---> Supabase Cloud
    |       - PostgreSQL Database
    |       - Authentication
    |       - Edge Functions (21 functions)
    |       - Storage
    |
    +---> Netlify
    |       - Static SPA Frontend
    |       - Global CDN
    |       - Automatic HTTPS
    |
    +---> Render
            - Heavy Calculations (Python/CoolProp)
            - Auto-scaling
```

## Quick Start

### One-Command Deployment

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

---

## Manual Deployment Steps

### 1. Prerequisites

Ensure you have the required tools installed:

```bash
# Node.js (v18+)
node --version

# Supabase CLI
npm install -g supabase
supabase --version

# Netlify CLI
npm install -g netlify-cli
netlify --version
```

### 2. Environment Setup

```bash
# Interactive setup wizard
./scripts/setup-env.sh

# Or copy template manually
cp .env.template .env
# Edit .env with your values
```

### 3. Database Migrations

```bash
# Link to your Supabase project
supabase link --project-ref rxqflxmzsqhqrzffcsej

# Push migrations
supabase db push
```

### 4. Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy ai-gateway --no-verify-jwt
supabase functions deploy ai-troubleshoot --no-verify-jwt
supabase functions deploy billing --no-verify-jwt
# ... (21 functions total)

# Or use the script
./scripts/deploy-supabase.sh --functions-only
```

### 5. Frontend Build & Deploy

```bash
# Build
npm run build:client

# Deploy to Netlify
netlify deploy --prod --dir=dist/spa
```

### 6. Render Deployment

Render deployments are triggered automatically via:

- Git push to connected repository
- Deploy hook URL (for CI/CD)

```bash
# Manual trigger via hook
curl -X POST "$RENDER_DEPLOY_HOOK_URL"
```

---

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
   - [ ] Tables exist (check Supabase Dashboard > Table Editor)
   - [ ] RLS policies active (check Authentication > Policies)
   - [ ] AI tables present (`ai_learning_patterns`, `diagnostic_outcomes`)

2. **Edge Functions**
   - [ ] All functions deployed (Supabase Dashboard > Edge Functions)
   - [ ] No errors in function logs
   - [ ] Test: `curl https://your-project.supabase.co/functions/v1/ai-gateway`

3. **Frontend**
   - [ ] Site loads (check Netlify URL)
   - [ ] Authentication works
   - [ ] Calculators functional

4. **Render**
   - [ ] Service healthy (check Render Dashboard)
   - [ ] API responds: `curl https://your-service.onrender.com/health`

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. **On push to `main`:**
   - Runs tests
   - Deploys database migrations
   - Deploys Edge Functions (parallel)
   - Builds and deploys frontend
   - Triggers Render deployment
   - Runs verification

2. **Manual triggers:**
   - Go to Actions > Deploy ThermoNeural > Run workflow
   - Select deployment target (all, supabase-only, frontend-only)

### Required GitHub Secrets

Add these in Settings > Secrets and variables > Actions:

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

---

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

# Or via Dashboard
# Deploys > Select previous deploy > Publish deploy
```

### Edge Functions Rollback

Re-deploy the previous version from Git:

```bash
git checkout <previous-commit>
./scripts/deploy-supabase.sh --functions-only
git checkout main
```

---

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

See [troubleshooting_deployment.md](./troubleshooting_deployment.md) for more.

---

## Best Practices

1. **Always run tests before deploying**

   ```bash
   npm run typecheck && npm run test
   ```

2. **Use preview deployments for testing**

   ```bash
   ./scripts/deploy-frontend.sh --preview
   ```

3. **Deploy database migrations before functions**
   - Functions may depend on new tables/columns

4. **Monitor after deployment**
   - Check Supabase Edge Function logs
   - Check Netlify function logs
   - Check Render service metrics

5. **Keep secrets secure**
   - Never commit `.env` to Git
   - Use GitHub Secrets for CI/CD
   - Rotate keys periodically
