# Native Automation Architecture

> **Philosophy**: Simplicity, Scalability, and reliability provided by Serverless Edge Functions.

## 1. Overview
## 1. Overview
We utilize Supabase Edge Functions (Deno) to handle all business logic and automation. This ensures:
- **Zero Ops**: No servers to manage, patch, or secure.
- **Infinite Scale**: Functions auto-scale with usage.
- **Tighter Integration**: Direct access to the database via `supabase-js`.

## 2. Event Flow
1.  **Event Source**:
    - **Database Change**: `INSERT`, `UPDATE`, `DELETE` triggers a webhook.
    - **Cron Job**: Scheduled tasks via `pg_cron`.
    - **Client Interaction**: User clicks a button in the UI.
2.  **Processing**:
    - **Supabase Edge Function**: Receives the payload, validates security (JWT/Secrets), and executes logic.
3.  **Action**:
    - **External API**: Send SMS (Telnyx), Email (Resend), etc.
    - **Database Update**: Write logs back to `system_logs` or update job status.

## 3. Core Automations (Phase 2)

### A. Review Hunter
- **Trigger**: Job status changes to `completed`.
- **Logic**:
    1.  Check if client has already recently reviewed.
    2.  Wait for configurable delay (e.g., 1 hour).
    3.  Send SMS/Email with unique review link.
- **Implementation**: `supabase/functions/review-hunter`

### B. Invoice Chaser
- **Trigger**: Scheduled Cron (Daily @ 9am).
- **Logic**:
    1.  Query `invoices` where `status = 'overdue'` and `last_reminder_sent < 3 days ago`.
    2.  Send polite reminder email.
    3.  Update `last_reminder_sent`.
- **Implementation**: `supabase/functions/invoice-chaser`
### C. EPA Compliance Engine
- **Trigger**: Job update involving "Refrigerant Handling" tag.
- **Logic**:
    1.  Verify Technician EPA Certification is on file.
    2.  Check for Leak Threshold breaches based on unit charge.
    3.  Log recovery/recharge amounts to the `epa_logs` table.
- [x] **Implementation**: `supabase/functions/epa-monitor`

### D. Smart Triage Analysis
- **Trigger**: New record in `triage_submissions`.
- **Logic**:
    1.  Fetch uploaded photo URLs.
    2.  Invoke `ai-gateway` (mode: `vision`) with expert HVAC prompt.
    3.  Store diagnostic notes, suspected issue, and severity.
- **Implementation**: `supabase/functions/analyze-triage-media`

### E. Intelligent AI Gateway
- **Role**: Central API controller and router.
- **Benefit**: Standardized interface for UI and backend functions to consume AI without repeating model-specific logic or keys.
- **Implementation**: `supabase/functions/ai-gateway`

## 4. Scalability
This architecture creates a stateless system.
- **10 Users**: Free tier handles it easily.
- **10,000 Users**: Functions scale horizontally. We pay only for execution time.
- **Concurrency**: Unlike a single API server which can block, Edge Functions run in parallel isolates.

## 5. Automation Enforcement

All Edge Functions perform a **Dual-Check** before sending notifications:
1.  **Company Identity**: Fetches name and basic white-labeling info from the `companies` table.
2.  **Client Preferences**: Fetches `notification_preferences` from the `clients` table.

**Validation Logic:**
- **Client Opt-Out**: If `sms_enabled` or `email_enabled` is `false` for a specific client, the notification is skipped.
- **Admin Override**: If the request includes `force_send: true`, the notification is sent regardless of client preferences (used for critical system alerts or manual triggers).

**Logic Flow (Deno):**
```typescript
// 1. Fetch Client Prefs
const { data: clientData } = await supabase
  .from('clients')
  .select('notification_preferences')
  .eq('id', clientId)
  .single();

const clientPrefs = clientData?.notification_preferences || { sms_enabled: true, email_enabled: true };

// 2. Check Permissions
if (channel === 'sms' && !clientPrefs.sms_enabled && !force_send) {
  return "Skipped (Client Opted Out)";
}
```

**Affected Functions:**
- **[webhook-dispatcher](file:///Users/riad/hvacR/HVAC-R/supabase/functions/webhook-dispatcher/index.ts)**: Handles `client_invite`, `system_alert`, `job_scheduled`.
- **[review-hunter](file:///Users/riad/hvacR/HVAC-R/supabase/functions/review-hunter/index.ts)**: Handles `review_request`.
- **[invoice-chaser](file:///Users/riad/hvacR/HVAC-R/supabase/functions/invoice-chaser/index.ts)**: Handles `invoice_reminder`.

> [!TIP]
> **Default Behavior**: If `notification_preferences` is `null`, all notifications are **allowed** to ensure zero-friction onboarding for new clients.
