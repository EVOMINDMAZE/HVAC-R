# Architecture

A high-level overview of the Simulateon system architecture.

## High-level Components

- Frontend: React + TypeScript single-page application served to users.
- Backend: Node/Express services that perform calculation workloads and orchestrate data storage and billing.
- Database: Postgres (via Supabase) for user and metadata storage.
- Billing: Stripe for subscriptions and payments.

## Deployment

- Environment variables (Supabase keys, Stripe keys) must be set in production.
- Use CI pipelines to run tests and a controlled deployment to the hosting environment.

## Observability

- Use Sentry for error reporting, logs for request tracing, and metrics for performance monitoring.
- Capture request IDs and correlate backend logs with frontend traces for easier debugging.

## Security

- Keep API keys and service role keys out of source control; use environment variables or secret management.
- Enforce HTTPS and rate limiting for public APIs.
