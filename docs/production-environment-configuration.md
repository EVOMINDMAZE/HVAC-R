# Production Environment Configuration

## Required Environment Variables

### 1. Supabase Configuration

| Variable | Current Value (Development) | Required Production Value | Status |
|----------|----------------------------|---------------------------|--------|
| `VITE_SUPABASE_URL` | `http://localhost:54321` | `https://rxqflxmzsqhqrzffcsej.supabase.co` | **Pending** |
| `VITE_SUPABASE_ANON_KEY` | `[DEVELOPMENT_ANON_KEY]` | Production anon key from Supabase dashboard | **Pending** |
| `SUPABASE_SERVICE_ROLE_KEY` | `[DEVELOPMENT_SERVICE_ROLE_KEY]` | Production service role key | **Pending** |
| `SUPABASE_JWT_SECRET` | `your_super_secret_jwt_key_change_in_production` | Production JWT secret from Supabase project settings | **Pending** |

### 2. Stripe Configuration

| Variable | Current Value (Development) | Required Production Value | Status |
|----------|----------------------------|---------------------------|--------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_your_stripe_publishable_key` | Production publishable key (starts with `pk_live_`) | **Pending** |
| `STRIPE_SECRET_KEY` | `sk_test_your_stripe_secret_key` | Production secret key (starts with `sk_live_` or `rk_live_`) | **Pending** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_your_webhook_secret` | Production webhook secret | **Pending** |
| `VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID` | `price_professional_monthly` | Production price ID from Stripe dashboard | **Pending** |
| `VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID` | `price_professional_yearly` | Production price ID from Stripe dashboard | **Pending** |
| `VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID` | `price_enterprise_monthly` | Production price ID from Stripe dashboard | **Pending** |
| `VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID` | `price_enterprise_yearly` | Production price ID from Stripe dashboard | **Pending** |

### 3. Application Configuration

| Variable | Current Value (Development) | Required Production Value | Status |
|----------|----------------------------|---------------------------|--------|
| `JWT_SECRET` | `your_super_secret_jwt_key_change_in_production` | Strong random string (64+ characters) | **Pending** |
| `CLIENT_URL` | `http://localhost:8080` | `https://your-app.netlify.app` (actual Netlify URL) | **Pending** |
| `VITE_API_BASE_URL` | Not set | `https://your-render-backend.onrender.com` (Render backend URL) | **Pending** |
| `NODE_ENV` | `development` | `production` | **Pending** |
| `DATABASE_URL` | `your_database_url_here` | Supabase connection string (optional - Supabase SDK may not need this) | **Pending** |

### 4. Email & External Services

| Variable | Current Value (Development) | Required Production Value | Status |
|----------|----------------------------|---------------------------|--------|
| `RESEND_API_KEY` | Not set | Resend API key for email notifications | **Pending** |
| Any other service keys | Not set | Production service keys | **Pending** |

## Configuration Sources

### Supabase Production Project

- **Project Reference**: `rxqflxmzsqhqrzffcsej` (from `supabase_setup.md`)
- **Dashboard URL**: `https://supabase.com/dashboard/project/rxqflxmzsqhqrzffcsej`
- **Database Password**: `TddR7OpEdrkbbwOE` (from documentation)

**To obtain production values:**

1. Log in to Supabase dashboard
2. Navigate to Project Settings → API
3. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT Secret` → `SUPABASE_JWT_SECRET`

### Stripe Production

1. Log in to Stripe dashboard
2. Navigate to Developers → API keys
3. Copy:
   - Publishable key → `VITE_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
4. Navigate to Developers → Webhooks
5. Create production webhook endpoint and copy signing secret → `STRIPE_WEBHOOK_SECRET`
6. Copy production price IDs from Products → Pricing

### Netlify Production URL

1. Deploy frontend to Netlify
2. Get production URL (e.g., `https://your-app.netlify.app`)
3. Set as `CLIENT_URL`

### Render Backend URL

1. Deploy backend to Render
2. Get production URL (e.g., `https://your-backend.onrender.com`)
3. Set as `VITE_API_BASE_URL` in frontend environment

## Configuration Files

### 1. `.env` File (Local Development)

Current file contains development values. **Do not commit production values to this file.**

### 2. Netlify Environment Variables

Production values should be set in Netlify dashboard:

- Site settings → Environment variables
- Add all `VITE_*` variables for frontend build

### 3. Render Environment Variables

Production values for backend should be set in Render dashboard:

- Service settings → Environment
- Add backend-specific variables (`JWT_SECRET`, `SUPABASE_*`, `STRIPE_SECRET_KEY`, etc.)

### 4. Supabase Environment Variables

Some variables should be set in Supabase dashboard for Edge Functions:

- Project settings → Environment variables
- Set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CLIENT_URL`

## Security Considerations

### ✅ **Completed Security Measures**

- JWT signature verification enabled (fixed vulnerability)
- Input validation enhanced for privacy endpoints
- Rate limiting middleware integrated
- No information leakage in error responses
- Consolidated baseline migration with `IF NOT EXISTS` safety

### ⚠️ **Pending Security Measures for Production**

- Rotate all default secrets (`JWT_SECRET`, `SUPABASE_JWT_SECRET`)
- Enable HTTPS only (Supabase production URL is HTTPS)
- Configure proper CORS for production domains
- Set secure headers (CSP, HSTS) in production
- Enable database backups and point-in-time recovery

## Deployment Configuration Files

### `netlify.toml`

- Already configured for SPA build
- Build command: `npm run build:client`
- Publish directory: `dist/spa`
- Environment variables should be set in Netlify dashboard

### `deploy-frontend.sh`

- Checks for required environment variables
- Builds client with `npm run build:client`
- Deploys to Netlify with `netlify deploy`

### `deploy-render.sh`

- Deploys backend to Render
- May need environment variable configuration

## Verification Steps

### Pre-Deployment Verification

1. [ ] All environment variables listed above have production values
2. [ ] Netlify environment variables configured
3. [ ] Render environment variables configured  
4. [ ] Supabase environment variables configured
5. [ ] Test production build with production variables

### Post-Deployment Verification

1. [ ] Frontend loads without errors
2. [ ] Backend API responds to health check
3. [ ] Supabase authentication works
4. [ ] Privacy endpoints function correctly
5. [ ] Stripe payment flows work
6. [ ] Email notifications are sent

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure `CLIENT_URL` and `VITE_API_BASE_URL` are correctly set
2. **Authentication failures**: Verify JWT secrets match between Supabase and backend
3. **Database connection issues**: Check Supabase service role key has proper permissions
4. **Build failures**: Verify all `VITE_*` variables are set in Netlify environment

### Emergency Rollback

If deployment fails:

1. Revert to previous Netlify deployment
2. Check environment variables for typos
3. Verify Supabase project is accessible
4. Check Render service logs for errors

---

**Last Updated**: 2026-02-07  
**Next Action**: Obtain production environment variable values from respective dashboards
