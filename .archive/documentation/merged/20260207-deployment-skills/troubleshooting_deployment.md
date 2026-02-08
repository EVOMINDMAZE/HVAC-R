---
name: Deployment Troubleshooting Guide
description: Common issues and solutions for ThermoNeural deployment.
version: 1.0
---

# Deployment Troubleshooting Guide

Common issues and solutions for ThermoNeural deployment.

## Quick Diagnostics

```bash
# Run verification script
./scripts/verify-deployment.sh --verbose

# Check all services
./scripts/verify-deployment.sh --json
```

---

## Supabase Issues

### "Error: supabaseUrl is required"

**Cause:** Environment variables not loaded.

**Fix:**

```bash
# Check .env file exists
ls -la .env

# Verify variables are set
source .env
echo $VITE_SUPABASE_URL

# Restart application
npm run dev
```

### "Error: Supabase CLI not authenticated"

**Cause:** Need to login to Supabase CLI.

**Fix:**

```bash
supabase login
```

### "Error: Project not linked"

**Cause:** Project reference not configured.

**Fix:**

```bash
supabase link --project-ref rxqflxmzsqhqrzffcsej
```

### "Migration failed: permission denied"

**Cause:** Incorrect database password or RLS blocking.

**Fix:**

1. Check `SUPABASE_DB_PASSWORD` is correct
2. Verify in Supabase Dashboard > Settings > Database

### "Edge Function deployment failed"

**Cause:** Various - check specific error.

**Debug:**

```bash
# Deploy with debug output
supabase functions deploy <function-name> --debug

# Check function logs
supabase functions logs <function-name>
```

**Common fixes:**

- Check TypeScript syntax errors
- Verify imports are correct
- Ensure dependencies are in `import_map.json`

### "RLS policy blocking queries"

**Cause:** Row Level Security is enforcing access control.

**Debug:**

```sql
-- Check policies in SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test as specific user
SET request.jwt.claim.sub = 'user-uuid';
SELECT * FROM your_table;
```

---

## Netlify Issues

### "Netlify CLI not authenticated"

**Cause:** Need to login to Netlify.

**Fix:**

```bash
netlify login
```

### "Site not linked"

**Cause:** Netlify site not connected.

**Fix:**

```bash
netlify link
# Select your site from the list
```

### "Build failed: Vite manifest not found"

**Cause:** Build didn't complete successfully.

**Fix:**

```bash
# Build locally first
npm run build:client

# Check dist folder
ls -la dist/spa/

# Then deploy
netlify deploy --prod --dir=dist/spa
```

### "CORS error in production"

**Cause:** Supabase URL configuration.

**Fix:**

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Netlify URL to "Site URL"
3. Add to "Redirect URLs"

### "Environment variables not working"

**Cause:** Variables not set in Netlify or wrong prefix.

**Fix:**

1. Go to Netlify Dashboard > Site Settings > Environment variables
2. Add all `VITE_*` variables
3. Trigger redeploy

---

## Render Issues

### "Service not starting"

**Cause:** Build or start command failing.

**Debug:**

1. Check Render Dashboard > Service > Logs
2. Look for error messages

**Common fixes:**

```bash
# Verify commands work locally
npm run build
npm run start
```

### "Health check failing"

**Cause:** `/health` endpoint not responding.

**Fix:**
Ensure your server has a health endpoint:

```javascript
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
```

### "Service sleeping (Free tier)"

**Cause:** Free tier services sleep after 15 minutes of inactivity.

**Fix:**

- Upgrade to Starter ($7/mo) or Standard ($25/mo) plan
- Services on paid plans don't sleep

### "Deploy hook not working"

**Cause:** URL is incorrect or expired.

**Fix:**

1. Render Dashboard > Service > Settings
2. Regenerate Deploy Hook
3. Update `RENDER_DEPLOY_HOOK_URL`

---

## GitHub Actions Issues

### "Workflow not running"

**Cause:** Workflow file syntax error or not on correct branch.

**Fix:**

1. Check workflow file syntax
2. Ensure pushing to `main` branch
3. Check Actions tab for error messages

### "Secret not found"

**Cause:** Secret name mismatch or not set.

**Fix:**

1. Go to Settings > Secrets and variables > Actions
2. Verify secret name matches exactly (case-sensitive)
3. Add missing secrets

### "Supabase deployment failed in CI"

**Cause:** Missing `SUPABASE_ACCESS_TOKEN`.

**Fix:**

1. Generate token at https://supabase.com/dashboard/account/tokens
2. Add as GitHub secret: `SUPABASE_ACCESS_TOKEN`

### "Netlify deployment failed in CI"

**Cause:** Missing or invalid Netlify credentials.

**Fix:**

1. Verify `NETLIFY_AUTH_TOKEN` is valid
2. Verify `NETLIFY_SITE_ID` matches your site
3. Check Netlify status: https://www.netlifystatus.com/

---

## Build Issues

### "TypeScript errors"

**Cause:** Type mismatches or missing types.

**Debug:**

```bash
npm run typecheck
```

**Fix:** Address each TypeScript error shown.

### "Module not found"

**Cause:** Missing dependency or incorrect import path.

**Fix:**

```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Check import path is correct
```

### "Out of memory during build"

**Cause:** Large bundle or complex compilation.

**Fix:**

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## Database Issues

### "Foreign key constraint violation"

**Cause:** Referenced record doesn't exist.

**Fix:**

1. Check the referenced table has the required record
2. Insert parent record before child record
3. Or remove the constraint if not needed

### "RLS recursion detected"

**Cause:** Policy references itself.

**Fix:** Use `SECURITY DEFINER` functions:

```sql
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;
```

### "Connection refused"

**Cause:** Network issue or wrong credentials.

**Fix:**

1. Verify `VITE_SUPABASE_URL` is correct
2. Check Supabase status: https://status.supabase.com/
3. Try from different network

---

## Performance Issues

### "Slow initial load"

**Cause:** Large bundle size.

**Fix:**

1. Check bundle size:
   ```bash
   npm run build
   # Look at output sizes
   ```
2. Implement code splitting (already done for routes)
3. Lazy load heavy components

### "API calls timing out"

**Cause:** Long-running queries or network issues.

**Fix:**

1. Add database indexes for slow queries
2. Implement pagination
3. Add caching where appropriate

---

## Getting Help

### 1. Check Logs

**Supabase:**

- Dashboard > Edge Functions > Logs

**Netlify:**

- Dashboard > Functions > Logs

**Render:**

- Dashboard > Service > Logs

### 2. Verify Configuration

```bash
./scripts/verify-deployment.sh --verbose
```

### 3. Test Locally

```bash
# Development mode
npm run dev

# Production build
npm run build && npm run start
```

### 4. Check Status Pages

- Supabase: https://status.supabase.com/
- Netlify: https://www.netlifystatus.com/
- Render: https://status.render.com/
- Stripe: https://status.stripe.com/
