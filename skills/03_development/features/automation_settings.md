---
name: Client Notification Preferences - Feature Documentation
description: The Client Notification Preferences feature allows individual clients to control their communication settings. Administrators can also view and mod...
version: 1.0
---

# Client Notification Preferences - Feature Documentation

> **Components**:
>
> - `client/src/components/dashboard/ClientNotificationSettings.tsx` (Client Portal)
> - `client/src/pages/ClientDetail.tsx` (Admin Settings Tab)
> - `client/src/components/invoices/InvoiceList.tsx` (Invoice Management)
> **Purpose**: Provides UI for controlling SMS and Email notification preferences and managing automated billing reminders.

## Overview

The Client Notification Preferences feature allows individual clients to control their communication settings. Administrators can also view and modify these settings on behalf of the client, with the additional capability to override preferences for critical alerts.

---

## Data Model

### Database Schema

**Table**: `clients`  
**Column**: `notification_preferences` (JSONB)

**Structure:**

```json
{
  "sms_enabled": true,
  "email_enabled": true
}
```

**Field Descriptions:**

- `sms_enabled`: Toggle for receiving SMS notifications (Invites, Alerts, Reviews).
- `email_enabled`: Toggle for receiving Email notifications (Invites, Alerts, Reviews).

---

## UI Components

### 1. Client Portal (`ClientNotificationSettings.tsx`)

Located in the "Settings" tab of the Client Dashboard. Allows clients to self-manage their opt-in status.

### 2. Admin Panel (`ClientDetail.tsx`)

Located in the "Settings" tab of the Client Detail page.

- **Preference Toggles**: Admin can see and change client settings.
- **Bypass Preferences**: A "Force Send" toggle that overrides client opt-outs for manual or critical triggers.
- **Manual Actions**: Buttons to send Portal Links or Review Requests immediately.

---

## Backend Enforcement

### Enforcement Flow

Edge Functions fetch the client's preferences and check them before dispatching:

```typescript
// Fetch client preferences
const { data: client } = await supabase
  .from('clients')
  .select('notification_preferences')
  .eq('id', clientId)
  .single();

const prefs = client?.notification_preferences;

// Check if we should send
const canSendSms = force_send || (prefs?.sms_enabled !== false);
const canSendEmail = force_send || (prefs?.email_enabled !== false);
```

### Affected Functions

- **webhook-dispatcher**: Enforces logic for automated invites and alerts.
- **review-hunter**: Enforces logic for review requests.
- **invoice-chaser**: Enforces logic for automated debt collection and reminders.

---

## Testing

### Automated Verification

Test scripts simulate workflow requests with various preference states:

1. **Client Opted-In**: Notification sent normally.
2. **Client Opted-Out**: Notification skipped (logged as `Skipped (Client Opted Out)`).
3. **Admin Override (`force_send: true`)**: Notification sent despite opt-out.

---

## User Experience Flow

1. **Admin/Support**: Navigates to a Client's Detail page → Settings.
2. **Configuration**: Verifies the client has SMS enabled.
3. **Manual Trigger**: Clicks "Send Portal Link" to invite the client.
4. **Override**: If a client has disabled emails but needs an urgent alert, the admin toggles "Bypass Preferences" and clicks the trigger.
