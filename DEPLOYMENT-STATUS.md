# ThermoNeural Deployment Status

## Architecture Overview

```
GitHub (Source)
    ├─→ Supabase Cloud (Database + Auth + Edge Functions)
    ├─→ Netlify (Static Frontend SPA)
    └─→ Render (Heavy Calculations Service)
```

## Source Of Truth (Prod API)

**Chosen model: Option A**: Supabase Edge Functions + direct Supabase client for the primary production API.

- **Frontend (Netlify)** talks to:
  - **Supabase (DB/Auth/Storage)** directly via `@supabase/supabase-js`
  - **Supabase Edge Functions** for automations/integrations/AI gateway workflows
  - **Render** for heavy thermodynamic calculations (external service)
- **Express (`/server`) is development/legacy only**:
  - Used in local dev via Vite middleware (`vite.config.ts`) for `/api/*`
  - Not considered the canonical production API surface

### Stable Endpoint Contracts

- **Supabase**:
  - DB + Auth: Supabase project `rxqflxmzsqhqrzffcsej`
  - Edge Functions: `https://<project>.supabase.co/functions/v1/<function>`
- **Render (Math Engine)**:
  - `VITE_CALCULATION_SERVICE_URL`

### Auth Token Contract (Canonical)

- **Frontend -> Supabase**: uses `@supabase/supabase-js` session access token.
- **Frontend -> Edge Functions**: send `Authorization: Bearer <supabase_access_token>` when function requires auth.
- **Frontend -> Express `/api/*` (dev/legacy only)**:
  - Send `Authorization: Bearer <supabase_access_token>`
  - Server verifies via `authenticateSupabaseToken` (preferred) and does not rely on the legacy token format.

---

## Deployment Methods

### 1. Automated (CI/CD) - Recommended

Push to `main` branch triggers automatic deployment via GitHub Actions.

**Setup Required:**

1. Add GitHub Secrets (see `skills/03_development/ci_cd_guide.md`)
2. Push to `main` branch
3. Monitor Actions tab for progress

### 2. Manual Scripts

```bash
# Full deployment
./scripts/deploy-all.sh

# Individual components
./scripts/deploy-supabase.sh    # Database + Functions
./scripts/deploy-frontend.sh     # Netlify
```

### 3. Dashboard Deployment

- **Supabase**: https://supabase.com/dashboard/project/rxqflxmzsqhqrzffcsej
- **Netlify**: https://app.netlify.com/sites
- **Render**: https://dashboard.render.com

---

## Quick Commands

```bash
# Environment setup (first time)
./scripts/setup-env.sh

# Verify current deployment
./scripts/verify-deployment.sh

# Full deployment
./scripts/deploy-all.sh

# Supabase only
./scripts/deploy-supabase.sh

# Frontend only
./scripts/deploy-frontend.sh

# Specific Edge Function
./scripts/deploy-supabase.sh --function ai-gateway
```

---

## Files Created

### Scripts (`/scripts/`)

| File                   | Purpose                   |
| ---------------------- | ------------------------- |
| `deploy-all.sh`        | Master deployment script  |
| `deploy-supabase.sh`   | Database + Edge Functions |
| `deploy-frontend.sh`   | Netlify deployment        |
| `verify-deployment.sh` | Health checks             |
| `setup-env.sh`         | Environment setup wizard  |

### CI/CD (`/.github/workflows/`)

| File         | Purpose                 |
| ------------ | ----------------------- |
| `deploy.yml` | GitHub Actions workflow |

### Configuration

| File            | Purpose                        |
| --------------- | ------------------------------ |
| `.env.template` | Environment variable template  |
| `render.yaml`   | Render Blueprint configuration |
| `netlify.toml`  | Netlify configuration          |

### Documentation (`/skills/03_development/`)

| File                            | Purpose                       |
| ------------------------------- | ----------------------------- |
| `deployment_workflows.md`       | Step-by-step deployment guide |
| `ci_cd_guide.md`                | GitHub Actions setup          |
| `render_deployment.md`          | Render-specific guide         |
| `environment_variables.md`      | Complete env var reference    |
| `troubleshooting_deployment.md` | Common issues & fixes         |

---

## Current Status

### Supabase (Database + Functions)

- **Project**: `rxqflxmzsqhqrzffcsej`
- **Tables**: All deployed including AI tables
- **Functions**: 21 Edge Functions ready
- **Status**: ✅ Production Ready

### Netlify (Frontend)

- **Build**: `dist/spa` (6.09MB PWA)
- **Config**: `netlify.toml` configured
- **Status**: ✅ Ready for deployment

### Render (Calculations)

- **Config**: `render.yaml` configured
- **Plan**: Standard (recommended)
- **Scaling**: 1-3 instances
- **Status**: ✅ Ready for deployment

---

## GitHub Secrets Required

Add these in: Settings > Secrets and variables > Actions

| Secret                        | Description               |
| ----------------------------- | ------------------------- |
| `SUPABASE_ACCESS_TOKEN`       | Supabase CLI access token |
| `SUPABASE_DB_PASSWORD`        | Database password         |
| `VITE_SUPABASE_URL`           | Supabase project URL      |
| `VITE_SUPABASE_ANON_KEY`      | Supabase anon key         |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key    |
| `NETLIFY_AUTH_TOKEN`          | Netlify access token      |
| `NETLIFY_SITE_ID`             | Netlify site ID           |
| `RENDER_DEPLOY_HOOK_URL`      | Render deploy hook        |

---

## Deployment Checklist

### First-Time Setup

- [ ] Clone repository
- [ ] Run `./scripts/setup-env.sh`
- [ ] Add GitHub Secrets
- [ ] Link Supabase: `supabase link --project-ref rxqflxmzsqhqrzffcsej`
- [ ] Link Netlify: `netlify link`

### Regular Deployment

- [ ] Run tests: `npm run typecheck && npm run test`
- [ ] Build: `npm run build`
- [ ] Deploy: `./scripts/deploy-all.sh` or push to `main`
- [ ] Verify: `./scripts/verify-deployment.sh`

### Post-Deployment

- [ ] Check Supabase Edge Function logs
- [ ] Verify frontend loads
- [ ] Test authentication
- [ ] Test key features (calculators, AI)

---

## Troubleshooting

See `skills/03_development/troubleshooting_deployment.md` for common issues.

Quick fixes:

```bash
# Supabase auth issue
supabase login

# Netlify not linked
netlify link

# Build failed
npm run build:client
```

---

## Documentation

- [Deployment Workflows](./skills/03_development/deployment_workflows.md)
- [CI/CD Guide](./skills/03_development/ci_cd_guide.md)
- [Render Deployment](./skills/03_development/render_deployment.md)
- [Environment Variables](./skills/03_development/environment_variables.md)
- [Troubleshooting](./skills/03_development/troubleshooting_deployment.md)

---

**Last Updated**: Feb 4, 2026
**Status**: 🟢 Ready for Deployment
