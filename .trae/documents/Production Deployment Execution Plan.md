# Production Deployment Execution Plan

## Phase 1: Pre-Deployment Validation
1. **Verify production checklist** - Run through the 10-category checklist
2. **Environment configuration** - Validate production environment variables
3. **Build verification** - Ensure production build works correctly
4. **Database migration** - Apply consolidated baseline migration to production Supabase

## Phase 2: Frontend Deployment (Netlify)
1. **Configure Netlify environment** - Set required environment variables:
   - `VITE_SUPABASE_URL` (production URL)
   - `VITE_SUPABASE_ANON_KEY` (production key)
   - `VITE_STRIPE_PUBLISHABLE_KEY` (production)
   - Other production-specific variables
2. **Execute frontend deployment** - Run `./scripts/deploy-frontend.sh --prod`
3. **Verify deployment** - Test frontend functionality with production API

## Phase 3: Backend Deployment (Render)
1. **Deploy backend API** - Use `deploy-render.sh` or Render dashboard
2. **Configure production environment** - Set backend environment variables
3. **Validate API connectivity** - Test privacy endpoints with production database
4. **Update frontend API URL** - Point frontend to production backend

## Phase 4: Database & Migration
1. **Apply production migrations** - Run consolidated `0001_initial_schema.sql`
2. **Verify privacy tables** - Confirm `user_consents` table exists and is functional
3. **Test RPC functions** - Validate `record_consent`, `has_consent` functions work

## Phase 5: Post-Deployment Validation
1. **Functional testing** - Test all privacy features in production:
   - Consent banner display and recording
   - DSR request submission
   - Data export requests
   - Consent checking
2. **Performance validation** - Verify response times meet SLAs
3. **Security validation** - Confirm JWT verification working, no information leakage
4. **Monitoring verification** - Ensure alerts are configured and functional

## Phase 6: Documentation & Handoff
1. **Update deployment records** - Document production deployment details
2. **Team communication** - Notify relevant teams of production status
3. **Monitoring handoff** - Confirm on-call team is aware of privacy monitoring alerts
4. **Compliance reporting** - Initial compliance report for legal/privacy teams

## Key Success Metrics
- ✅ All privacy endpoints respond < 200ms P95
- ✅ Consent recording success rate > 99.9%
- ✅ DSR requests processed within 30-day SLA
- ✅ No security vulnerabilities in production
- ✅ Comprehensive audit trail operational

## Rollback Plan
- **Timeframe**: 2-hour rollback window
- **Procedure**: Revert to previous deployment version
- **Triggers**: Critical security issues, privacy endpoint failures, data loss risk