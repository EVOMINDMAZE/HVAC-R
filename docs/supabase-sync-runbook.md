# Supabase Cloud Synchronization Runbook

## Overview

This runbook documents the process for synchronizing local development environment with Supabase cloud infrastructure. Run this before major deployments or after project inactivity.

## When to Run Verification

### Pre-Deployment Checklist
- Before releasing new features to production
- After resuming Supabase project from pause/inactivity
- After adding new Edge Functions
- After adding new database migrations
- After updating API keys or secrets

### Regular Maintenance
- Weekly verification recommended
- After any Supabase project settings change
- After team member changes affecting access

## Quick Start

### Run Full Verification

```bash
node scripts/supabase-verify.cjs
```

Expected output:
```
🔍 Supabase Cloud Synchronization Verification

==================================================

📊 Edge Functions Status:
--------------------------------------------------
   Total deployed: 22 functions
   ✅ All functions are ACTIVE

🔐 Secrets Configuration:
--------------------------------------------------
   Total secrets configured: 24
   
   ✅ GOOGLE_SERVICE_ACCOUNT_JSON
   ✅ Other secrets...

==================================================

✅ Supabase Cloud is fully synchronized!
```

## Step-by-Step Synchronization Process

### Step 1: Verify CLI Access

```bash
# Check CLI installation
supabase --version

# Verify authentication
supabase projects list
```

### Step 2: Verify Project Link

```bash
supabase status
```

Should show: `rxqflxmzsqhqrzffcsej.supabase.co`

### Step 3: Verify Edge Functions

```bash
# List deployed functions
supabase functions list

# Compare with local
ls supabase/functions/
```

### Step 4: Deploy Missing Functions

```bash
# Deploy specific function
supabase functions deploy function-name

# Deploy all functions
for func in supabase/functions/*/; do
  supabase functions deploy "$(basename "$func")"
done
```

### Step 5: Verify Secrets

```bash
# List configured secrets
supabase secrets list
```

### Step 6: Apply Missing Migrations (if needed)

```bash
# Push local migrations to cloud
supabase db push
```

## Secret Management

### Required Secrets

| Secret Name | Purpose | Required |
|-------------|---------|----------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Sheets API integration | ✅ |
| `STRIPE_SECRET_KEY` | Payment processing | ✅ |
| `RESEND_API_KEY` | Email delivery | ✅ |
| `XAI_API_KEY` | AI/Grok Vision | Optional |
| `DEEPSEEK_API_KEY` | DeepSeek Reasoner | Optional |
| `GROQ_API_KEY` | Groq LLama | Optional |
| `TELNYX_API_KEY` | SMS delivery | Optional |

### Adding Secrets

#### Via Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard
2. Select project: `rxqflxmzsqhqrzffcsej`
3. Go to: Edge Functions → Secrets
4. Click: New Secret
5. Enter name and value
6. Click: Save

#### Via CLI

```bash
# Add single secret
supabase secrets set SECRET_NAME=value

# Add multiple secrets
supabase secrets set SECRET1=value1 SECRET2=value2
```

### Checking Secret Configuration

```bash
# List all secrets (names only)
supabase secrets list

# Verify specific secret is present
supabase secrets list | grep GOOGLE_SERVICE_ACCOUNT_JSON
```

## Troubleshooting

### Problem: "Project not found"

**Cause**: Not linked to project

**Solution**:
```bash
supabase link --project-ref rxqflxmzsqhqrzffcsej
```

### Problem: "Authentication required"

**Cause**: Not logged in

**Solution**:
```bash
supabase login
```

### Problem: Functions show "INACTIVE"

**Cause**: Deployment failed or function error

**Solution**:
```bash
# Redeploy function
supabase functions deploy function-name

# Check function logs
supabase functions logs function-name
```

### Problem: Missing secrets after deployment

**Cause**: Secrets not configured in cloud

**Solution**:
```bash
# Add missing secrets
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
```

### Problem: Migration drift

**Cause**: Local migrations not applied to cloud

**Solution**:
```bash
# Apply migrations
supabase db push

# Verify
supabase migration list
```

## Recovery Procedures

### Complete Reset (if needed)

⚠️ **Warning**: This will reset cloud to match local state

```bash
# 1. Backup current cloud state
supabase db dump > backup-$(date +%Y%m%d).sql

# 2. Reset database
supabase db reset

# 3. Push local migrations
supabase db push

# 4. Redeploy all functions
supabase functions deploy --all
```

### Emergency Secret Recovery

If secrets are lost:
1. Check `.env` file (local backup)
2. Check password manager
3. Regenerate from service providers:
   - Google Cloud Console
   - Stripe Dashboard
   - Resend Dashboard

## Verification Checklist

Use this checklist for verification sign-off:

- [ ] CLI authenticated and linked
- [ ] All Edge Functions deployed and ACTIVE
- [ ] All required secrets configured
- [ ] Migrations up to date
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` present
- [ ] `sync-spreadsheets` function working
- [ ] No errors in verification script

## Contact Information

### Supabase Support
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs

### Project Details
- Project ID: `rxqflxmzsqhqrzffcsej`
- Region: Configure based on your setup
- Plan: Check Supabase dashboard

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Database Migrations Guide](https://supabase.com/docs/guides/database/migrations)

---

Last Updated: 2026-03-18
Maintainer: ThermoNeural Dev Team