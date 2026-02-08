# CI/CD Pipeline Guide

This document explains how to set up and manage the automated CI/CD pipeline for ThermoNeural.

## Overview

The pipeline uses **GitHub Actions** to automatically deploy changes when code is pushed to the `main` branch.

### Pipeline Flow

```
Push to main
    |
    v
+-------------------+
|   Run Tests       |  <- TypeScript check + Unit tests
+-------------------+
    |
    v (if tests pass)
+-------------------+     +-------------------+     +-------------------+
| Deploy Database   | --> | Deploy Functions  | --> | Deploy Frontend   |
| (Supabase)        |     | (21 in parallel)  |     | (Netlify)         |
+-------------------+     +-------------------+     +-------------------+
    |                                                       |
    v                                                       v
+-------------------+                             +-------------------+
| Trigger Render    |                             | Verification      |
| Deploy            |                             | Checks            |
+-------------------+                             +-------------------+
```

## Setup Instructions

### 1. GitHub Repository Secrets

Navigate to: **Settings > Secrets and variables > Actions**

Add these secrets:

#### Required Secrets

| Secret                        | Where to get it                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN`       | [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) > Access Tokens > Generate new token |
| `SUPABASE_DB_PASSWORD`        | Your Supabase project database password                                                                  |
| `VITE_SUPABASE_URL`           | Supabase Dashboard > Project Settings > API > Project URL                                                |
| `VITE_SUPABASE_ANON_KEY`      | Supabase Dashboard > Project Settings > API > anon/public key                                            |
| `VITE_STRIPE_PUBLISHABLE_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) > Publishable key                               |
| `NETLIFY_AUTH_TOKEN`          | [Netlify User Settings](https://app.netlify.com/user/applications) > Personal access tokens              |
| `NETLIFY_SITE_ID`             | Netlify Dashboard > Site Settings > General > Site ID                                                    |

#### Optional Secrets

| Secret                   | Purpose                           |
| ------------------------ | --------------------------------- |
| `RENDER_DEPLOY_HOOK_URL` | Auto-trigger Render deployments   |
| `RENDER_SERVICE_URL`     | Health check for Render service   |
| `SLACK_WEBHOOK_URL`      | Deployment notifications to Slack |

### 2. Enable GitHub Actions

1. Go to **Actions** tab in your repository
2. Click "I understand my workflows, go ahead and enable them"
3. The workflow file is already at `.github/workflows/deploy.yml`

### 3. Connect Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Create a new site (if not already created)
3. **Important**: Do NOT enable Netlify's auto-deploy from Git
   - We use GitHub Actions to control deployments
   - Go to Site Settings > Build & Deploy > Continuous Deployment > Stop builds

## Workflow Configuration

### File Location

`.github/workflows/deploy.yml`

### Trigger Conditions

```yaml
on:
  push:
    branches: [main] # Auto-deploy on push to main
  workflow_dispatch: # Manual trigger
    inputs:
      deploy_target:
        type: choice
        options:
          - all
          - supabase-only
          - frontend-only
          - functions-only
```

### Jobs Overview

| Job                     | Purpose                       | Runs On               |
| ----------------------- | ----------------------------- | --------------------- |
| `test`                  | TypeScript check + unit tests | Every push            |
| `deploy-supabase-db`    | Database migrations           | After tests pass      |
| `deploy-edge-functions` | 21 functions in parallel      | After DB migrations   |
| `deploy-frontend`       | Build + Netlify deploy        | After tests pass      |
| `deploy-render`         | Trigger Render hook           | After tests pass      |
| `verify-deployment`     | Health checks                 | After all deployments |
| `notify-failure`        | Create GitHub issue           | On any failure        |

## Manual Deployment

### Via GitHub UI

1. Go to **Actions** tab
2. Select "Deploy ThermoNeural"
3. Click "Run workflow"
4. Select deployment target:
   - `all` - Full deployment
   - `supabase-only` - DB + Functions only
   - `frontend-only` - Netlify only
   - `functions-only` - Edge Functions only
5. Click "Run workflow"

### Via GitHub CLI

```bash
# Install GitHub CLI
brew install gh

# Trigger deployment
gh workflow run deploy.yml

# With specific target
gh workflow run deploy.yml -f deploy_target=frontend-only

# Watch progress
gh run watch
```

## Deployment Logs

### View Workflow Runs

1. Go to **Actions** tab
2. Click on a workflow run
3. Expand job steps to see logs

### Common Log Locations

- **Test failures**: `test` job > "Run unit tests" step
- **Migration errors**: `deploy-supabase-db` job > "Push database migrations"
- **Function errors**: `deploy-edge-functions` job > Matrix jobs
- **Build errors**: `deploy-frontend` job > "Build client"

## Monitoring & Alerts

### Deployment Summary

After each deployment, a summary is posted to:

- **GitHub Actions**: Workflow summary page
- **GitHub Issues**: On failure (auto-created)

### Integration Options

Add these to receive notifications:

**Slack**

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Email** (via GitHub notifications)

- Enable in Settings > Notifications > Actions

## Troubleshooting CI/CD

### "Supabase CLI not authenticated"

The `SUPABASE_ACCESS_TOKEN` secret is missing or invalid.

**Fix:**

1. Generate new token at https://supabase.com/dashboard/account/tokens
2. Update GitHub secret

### "Netlify deploy failed"

Check these common causes:

- `NETLIFY_AUTH_TOKEN` expired
- `NETLIFY_SITE_ID` incorrect
- Build errors in client code

**Fix:**

```bash
# Test locally first
npm run build:client
netlify deploy --dir=dist/spa
```

### "Edge Function deployment failed"

Individual function failures don't stop the workflow (fail-fast disabled).

**Fix:**

1. Check the specific function's job in the matrix
2. Deploy locally to debug:
   ```bash
   supabase functions deploy <function-name> --debug
   ```

### "Tests failing"

**Fix:**

```bash
# Run locally
npm run typecheck
npm run test

# Fix issues, then push
```

### "Verification failed"

Post-deployment checks found issues.

**Fix:**

1. Check verification logs
2. Verify services manually
3. Check Supabase/Netlify/Render dashboards

## Best Practices

### 1. Branch Protection

Enable branch protection for `main`:

- Require status checks before merging
- Require the `test` job to pass

### 2. Environment Separation

For staging environments:

```yaml
# Add to workflow
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    # ... staging configuration
```

### 3. Secrets Rotation

Rotate secrets periodically:

- Supabase Access Token: Monthly
- Netlify Auth Token: Quarterly
- Stripe keys: Annually (or on suspected compromise)

### 4. Rollback Strategy

If deployment fails:

1. Check GitHub Actions logs
2. Fix the issue in a new commit
3. Push to trigger new deployment

For immediate rollback:

```bash
# Frontend: Use Netlify rollback
netlify rollback

# Database: Manual migration required
# Functions: Redeploy from previous commit
```

## Advanced Configuration

### Parallel Deployments

Edge Functions deploy in parallel via matrix strategy:

```yaml
strategy:
  matrix:
    function: [ai-gateway, billing, ...]
  fail-fast: false # Don't stop on single failure
```

### Conditional Deployments

Skip deployments for documentation-only changes:

```yaml
on:
  push:
    branches: [main]
    paths-ignore:
      - "**.md"
      - "docs/**"
```

### Cache Optimization

Node modules are cached:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: "npm" # Caches node_modules
```
