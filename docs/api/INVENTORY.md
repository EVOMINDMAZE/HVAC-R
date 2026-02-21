# API Documentation Inventory

**Date:** 2026-02-21  
**Analyst:** AI Assistant  
**Purpose:** Inventory of all API endpoints to identify documentation gaps
**Last Reconciled:** 2026-02-21 (Phase 3 Batch 2)

## Summary

- **Total Endpoints:** 27
- **Documented Endpoints:** 27 (100%)
- **Authentication Required:** 22 (81%)
- **Public Endpoints:** 5 (19%)
- **OpenAPI Spec:** [`docs/api/openapi.yaml`](./openapi.yaml) (v2.0.0)

## Endpoint Inventory

### Authentication (Public)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/auth/signup` | User registration | No | ✅ Documented in OpenAPI |
| POST | `/api/auth/signin` | User login | No | ✅ Documented in OpenAPI |
| POST | `/api/auth/signout` | User logout | Yes (token) | ✅ Documented in OpenAPI |
| GET | `/api/auth/me` | Get current user | Yes (token) | ✅ Documented in OpenAPI |

### Calculations (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/calculations` | Save a calculation | Yes | ✅ Documented in OpenAPI |
| GET | `/api/calculations` | List user calculations | Yes | ✅ Documented in OpenAPI |
| GET | `/api/calculations/:id` | Get specific calculation | Yes | ✅ Documented in OpenAPI |
| PUT | `/api/calculations/:id` | Update calculation | Yes | ✅ Documented in OpenAPI |
| DELETE | `/api/calculations/:id` | Delete calculation | Yes | ✅ Documented in OpenAPI |
| GET | `/api/user/stats` | Get user statistics | Yes | ✅ Documented in OpenAPI |

### Team Management (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/team` | Get team members | Yes | ✅ Documented in OpenAPI |
| POST | `/api/team/invite` | Invite team member | Yes | ✅ Documented in OpenAPI |
| PUT | `/api/team/role` | Update team member role | Yes | ✅ Documented in OpenAPI |
| DELETE | `/api/team/member` | Remove team member | Yes | ✅ Documented in OpenAPI |

### Fleet Management (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/fleet/status` | Get fleet status | Yes | ✅ Documented in OpenAPI |

### Subscriptions (Mixed)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/subscriptions/plans` | Get available subscription plans | No | ✅ Documented in OpenAPI |
| GET | `/api/subscriptions/current` | Get current subscription | Yes | ✅ Documented in OpenAPI |
| POST | `/api/subscriptions/update` | Update subscription | Yes | ✅ Documented in OpenAPI |
| POST | `/api/subscriptions/cancel` | Cancel subscription | Yes | ✅ Documented in OpenAPI |
| POST | `/api/subscriptions/payment-intent` | Create payment intent | Yes | ✅ Documented in OpenAPI |

### Billing Routes (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| * | `/api/billing/*` | Stripe webhook and billing operations | Mixed | ✅ Documented in OpenAPI |

### Engineering Calculations (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/calculate-airflow` | Calculate airflow | Yes | ✅ Documented in OpenAPI |
| POST | `/api/calculate-deltat` | Calculate delta T | Yes | ✅ Documented in OpenAPI |
| POST | `/api/calculate-standard` | Standard vapor compression cycle | Yes | ✅ Documented in OpenAPI |
| POST | `/api/calculate-cascade` | Cascade cycle analysis | Yes | ✅ Documented in OpenAPI |
| POST | `/api/compare-refrigerants` | Compare refrigerants | Yes | ✅ Documented in OpenAPI |

### Storage (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/storage/upload` | Upload avatar/image | Yes | ✅ Documented in OpenAPI |

### Diagnostics (Public)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/diagnostics/supabase` | Test Supabase connectivity | No | ✅ Documented in OpenAPI |

### Reports (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/reports/generate` | Generate PDF report | Yes | ✅ Documented in OpenAPI |

### AI Pattern Recognition (Protected)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| POST | `/api/ai/patterns/analyze` | Analyze patterns | Yes | ✅ Documented in OpenAPI |
| POST | `/api/ai/patterns/related` | Get related patterns | Yes | ✅ Documented in OpenAPI |
| POST | `/api/ai/patterns/symptom-outcome` | Create symptom-outcome pattern | Yes | ✅ Documented in OpenAPI |
| POST | `/api/ai/patterns/measurement-anomaly` | Create measurement anomaly pattern | Yes | ✅ Documented in OpenAPI |
| PUT | `/api/ai/patterns/:patternId/feedback` | Update pattern feedback | Yes | ✅ Documented in OpenAPI |
| GET | `/api/ai/patterns/:companyId/:type` | Get patterns by type | Yes | ✅ Documented in OpenAPI |
| POST | `/api/ai/enhanced-troubleshoot` | Enhanced troubleshooting | Yes | ✅ Documented in OpenAPI |

### Health Check (Public)

| Method | Path | Description | Auth Required | Documentation Status |
|--------|------|-------------|---------------|---------------------|
| GET | `/api/health` | System health check | No | ✅ Documented in OpenAPI |

## Documentation Status

### Completed

1. **OpenAPI 3.0.3 Specification** - Full API spec at [`docs/api/openapi.yaml`](./openapi.yaml)
2. **Authentication documentation** - Bearer token auth documented in OpenAPI securitySchemes
3. **Request/response examples** - Included in OpenAPI spec for all endpoints
4. **Error documentation** - Standard error responses documented (400, 401, 403, 404, 409, 500)
5. **Rate limiting documentation** - Documented in OpenAPI info section

### Remaining Work

1. **Interactive API playground** - Consider adding Swagger UI at `/api/docs`
2. **SDK/client library generation** - Can be generated from OpenAPI spec
3. **API versioning strategy** - Currently v2.0.0; deprecation policy needed

## Source of Truth

- **OpenAPI Specification:** [`docs/api/openapi.yaml`](./openapi.yaml) is the canonical source
- **Route Definitions:** `server/index.ts` and `server/routes/*.ts`
- **Type Definitions:** `shared/types/dtos.ts` for shared DTOs

---
**Inventory Generated:** 2026-02-07  
**Last Updated:** 2026-02-21  
**Source:** `server/index.ts` route definitions, `docs/api/openapi.yaml`  
**Validation:** Cross-referenced with OpenAPI specification
