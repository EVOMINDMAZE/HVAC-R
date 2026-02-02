---
description: How to manage and override client-level notification preferences.
---

# Managing Client Notification Preferences

This workflow describes how to view, update, and override SMS/Email notification preferences for individual clients.

## 1. Accessing Client Settings (Admin)
1.  Navigate to the **Clients** list.
2.  Click on a specific client to open the **Client Detail** page.
3.  Click on the **Settings** tab.
4.  View/Toggle **SMS Notifications** and **Email Notifications** in the "Notification Preferences" section.
5.  Click **Save Preferences** to persist changes.

## 2. Administrator Overrides & Manual Triggers
Administrators can send critical notifications even if a client has opted out.

1.  In the **Client Detail > Settings** tab, locate the **Owner Override & Manual Actions** section.
2.  Toggle **Bypass Preferences** to `ON` (indicates `force_send: true`).
3.  Click **Send Portal Link** or **Send Review Request** to trigger the notification manually.
4.  The system will bypass client-level opt-outs and proceed with delivery.

## 3. Client Self-Management
Clients can manage their own preferences via the Client Portal.

1.  Client logs in to the **Thermoneural Client Dashboard**.
2.  Navigate to the **Settings** tab.
3.  Toggle SMS/Email preferences.
4.  Changes are saved automatically and reflected immediately in the Admin panel.

## 4. Verification & Troubleshooting
- **Logs**: Check Supabase logs for `Skip (Client Opted Out)` messages to verify enforcement.
- **Workflow Requests**: View the `workflow_requests` table to see the `force_send` flag and `_triggered_by` metadata.
- **Edge Function Status**: Ensure `webhook-dispatcher` and `review-hunter` are successfully processing requests.
