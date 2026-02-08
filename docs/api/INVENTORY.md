# API Documentation Inventory

**Date:** 2026-02-07  
**Analyst:** AI Assistant  
**Purpose:** Inventory of all API endpoints to identify documentation gaps

## Summary

- **Total Endpoints:** 27
- **Documented Endpoints:** 0 (0%)
- **Authentication Required:** 22 (81%)
- **Public Endpoints:** 5 (19%)

## Endpoint Inventory

### Authentication (Public)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/auth/signup` | User registration | No | ❌ Missing |
| POST | `/api/auth/signin` | User login | No | ❌ Missing |
| POST | `/api/auth/signout` | User logout | Yes (token) | ❌ Missing |
| GET | `/api/auth/me` | Get current user | Yes (token) | ❌ Missing |

### Calculations (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/calculations` | Save a calculation | Yes | ❌ Missing |
| GET | `/api/calculations` | List user calculations | Yes | ❌ Missing |
| GET | `/api/calculations/:id` | Get specific calculation | Yes | ❌ Missing |
| PUT | `/api/calculations/:id` | Update calculation | Yes | ❌ Missing |
| DELETE | `/api/calculations/:id` | Delete calculation | Yes | ❌ Missing |
| GET | `/api/user/stats` | Get user statistics | Yes | ❌ Missing |

### Team Management (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/team` | Get team members | Yes | ❌ Missing |
| POST | `/api/team/invite` | Invite team member | Yes | ❌ Missing |
| PUT | `/api/team/role` | Update team member role | Yes | ❌ Missing |
| DELETE | `/api/team/member` | Remove team member | Yes | ❌ Missing |

### Fleet Management (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/fleet/status` | Get fleet status | Yes | ❌ Missing |

### Subscriptions (Mixed)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/subscriptions/plans` | Get available subscription plans | No | ❌ Missing |
| GET | `/api/subscriptions/current` | Get current subscription | Yes | ❌ Missing |
| POST | `/api/subscriptions/update` | Update subscription | Yes | ❌ Missing |
| POST | `/api/subscriptions/cancel` | Cancel subscription | Yes | ❌ Missing |
| POST | `/api/subscriptions/payment-intent` | Create payment intent | Yes | ❌ Missing |

### Billing Routes (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| * | `/api/billing/*` | Stripe webhook and billing operations | Mixed | ❌ Missing |

### Engineering Calculations (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/calculate-airflow` | Calculate airflow | Yes | ❌ Missing |
| POST | `/api/calculate-deltat` | Calculate delta T | Yes | ❌ Missing |
| POST | `/api/calculate-standard` | Standard vapor compression cycle | Yes | ❌ Missing |
| POST | `/api/calculate-cascade` | Cascade cycle analysis | Yes | ❌ Missing |
| POST | `/api/compare-refrigerants` | Compare refrigerants | Yes | ❌ Missing |

### Storage (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/storage/upload` | Upload avatar/image | Yes | ❌ Missing |

### Diagnostics (Public)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/diagnostics/supabase` | Test Supabase connectivity | No | ❌ Missing |

### Reports (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/reports/generate` | Generate PDF report | Yes | ❌ Missing |

### AI Pattern Recognition (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/ai/patterns/analyze` | Analyze patterns | Yes | ❌ Missing |
| POST | `/api/ai/patterns/related` | Get related patterns | Yes | ❌ Missing |
| POST | `/api/ai/patterns/symptom-outcome` | Create symptom-outcome pattern | Yes | ❌ Missing |
| POST | `/api/ai/patterns/measurement-anomaly` | Create measurement anomaly pattern | Yes | ❌ Missing |
| PUT | `/api/ai/patterns/:patternId/feedback` | Update pattern feedback | Yes | ❌ Missing |
| GET | `/api/ai/patterns/:companyId/:type` | Get patterns by type | Yes | ❌ Missing |
| POST | `/api/ai/enhanced-troubleshoot` | Enhanced troubleshooting | Yes | ❌ Missing |

### Health Check (Public)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/health` | System health check | No | ❌ Missing |

## Documentation Gaps Analysis

### High Priority Gaps

1. **Zero API documentation exists** - No OpenAPI spec, no endpoint descriptions
2. **No authentication documentation** - No guide on obtaining/using tokens
3. **No request/response examples** - Developers cannot test endpoints
4. **No error documentation** - Error responses not documented

### Medium Priority Gaps

1. **No API versioning documentation** - Version strategy not defined
2. **No rate limiting documentation** - Usage limits not specified
3. **No deprecation policies** - Endpoint lifecycle not documented

### Low Priority Gaps

1. **No SDK/client library documentation** - No generated client code
2. **No interactive API playground** - No Swagger UI or similar

## Next Steps

1. Create OpenAPI 3.0 specification covering all endpoints
2. Generate Swagger UI documentation portal
3. Add JSDoc comments to all route handlers
4. Create API usage guides with examples
5. Implement automated documentation generation in CI/CD

---
**Inventory Generated:** 2026-02-07  
**Source:** `server/index.ts` route definitions  
**Validation:** Manual review of route files
