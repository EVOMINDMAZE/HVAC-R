# Architecture

Overview of the Simulateon system architecture.

## High-level Components
- Frontend: React + TypeScript SPA served to users.
- Backend: Node/Express server for API and server-side endpoints.
- Supabase: Authentication, Edge Functions, and storage.
- Stripe: Billing and checkout (optional; requires keys).
- Calculation backend: External service (or internal logic) accessible via HTTP.

## Deployment Notes
- Environment variables for Supabase and Stripe must be set in production.
- Use ALLOWED_CORS_ORIGINS to restrict origins.
- Netlify is used for deployment (connect via MCP if needed).

## Observability
- Use Sentry for error reporting and logs for server requests.
- Health checks available at /api/health and API Service Status UI component.

Security
- Protect endpoints with Supabase JWT or session tokens.
- Do not commit secret keys to source control.
