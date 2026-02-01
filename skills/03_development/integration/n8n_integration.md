---
name: n8n Integration & Strategy
description: Defines how the HVAC-R App communicates with the Member's private n8n microserver.
---

# n8n Integration Strategy

Each "Business in a Box" member gets a private n8n instance. This skill defines how the core App talks to these distributed instances.

## 1. Architecture
*   **One-to-Many**: The Main App (SaaS) -> Many Private n8n Servers.
*   **Configuration**:
    *   Stored in `companies` table (Supabase).
    *   Fields: `n8n_config` (JSONB) containing `webhook_url` and `webhook_secret`.

## 2. Standard Webhook Events
The App will fire webhooks to the Member's n8n instance on these standardized triggers.

| Event | Payload | n8n Workflow Blueprint |
| :--- | :--- | :--- |
| `job.created` | `job_id`, `client_details`, `address` | **"New Job Dispatch"**: SMS to tech + Email to client. |
| `job.completed` | `job_id`, `invoice_amount` | **"Review Request"**: Wait 1h -> Send Google Review Link. |
| `lead.capture` | `contact_info`, `source` | **"Speed to Lead"**: Instant SMS reply + Add to CRM. |

## 3. The "Blueprint" Library
We don't just give them the server; we give them the **flows**.
*   **Repo**: We maintain a library of n8n JSON exports.
*   **Usage**: Member imports our "Dispatch Blueprint" into their n8n instance.
*   **Optimization**: Ensure App webhooks match the Blueprint's "Webhook Node" inputs exactly.

## 4. Security
*   **Signature Header**: All webhooks sent from the App must include `X-HVAC-Signature` (HMAC SHA256) so the Member's n8n can verify it's truly from us.
*   **Retry Logic**: If the Member's server is down ($5 servers crash), the App must retry delivery for 24h.
