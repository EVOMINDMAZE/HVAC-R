# Cloud Strategy: 100% Serverless

> **Philosophy**: Zero Ops. Infinite Scale. Pay-per-use.

## 1. Core Architecture
The HVAC-R SaaS Platform is built entirely on serverless primitives. We do not manage virtual machines (VMs) or containers.

### A. The Backend: Supabase Cloud
Supabase provides the entire backend suite (Postgres, Auth, Storage, Edge Functions).

*   **Database**: Postgres (Managed). Handles all data, RLS security, and Realtime subscriptions.
*   **Auth**: Managed Authentication (Email, Social, Enterprise SSO).
*   **Storage**: S3-compatible object storage for photos/documents.
*   **Automations**: **Supabase Edge Functions** (Deno). This is our "backend logic" layer.
    *   *Usage*: Handling webhooks, sending emails/SMS, complex business logic, cron jobs.
    *   *Scale*: Auto-scales to zero. No idle costs.

### B. The Frontend: Netlify
The React Application (Vite) is a static asset bundle deployed globally.

*   **CDN**: Assets distributed worldwide.
*   **CI/CD**: Auto-deploys on push to `main`.
*   **Redirects**: Handles SPA routing (`/* -> /index.html`).

### C. The Heavy Lifting: Render (Specialized)
*Only* for long-running or computationally expensive tasks that exceed Edge Function limits (like complex energy modeling or PDF generation).
*   **Service**: Web Service (Docker).
*   **Scale**: Spun up on demand or kept minimal.

## 2. Infrastructure as Code (IaC)
We do not manually provision servers.
*   **Database**: Managed via `supabase/migrations`.
*   **Functions**: Deployed via `supabase functions deploy`.
*   **Frontend**: Configured via `netlify.toml`.

## 3. Security Model
*   **Zero Trust**: No VPNs or VPC peering required.
*   **RLS**: Row Level Security ensures data isolation at the database level.
*   **Service Roles**: Edge Functions use strict IAM roles.

## 4. Cost Model
*   **Fixed Costs**: $25/mo (Supabase Pro) + $19/mo (Netlify Pro).
*   **Variable Costs**:
    *   Edge Functions: ~$2 per million invocations.
    *   Storage: Standard S3 rates.
    *   Database: Scales with storage/compute usage.
*   **Margin**: This architecture allows us to serve thousands of free-tier users with negligible incremental cost.
