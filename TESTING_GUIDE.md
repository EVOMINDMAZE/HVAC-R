# Multi-Tenant System Testing Guide

**Test Environment:** http://localhost:3001  
**Test Credentials Provided Below**

---

## 🔧 Development Authentication Bypass

For development and testing convenience, the application includes an authentication bypass feature that allows full access without valid credentials.

### How to Activate

1. **URL Parameter**: Append `?bypassAuth=1` to any URL (e.g., `http://localhost:3001/dashboard?bypassAuth=1`)
2. **LocalStorage Flag**: Set `DEBUG_BYPASS=1` in browser's localStorage:
   ```javascript
   localStorage.setItem('DEBUG_BYPASS', '1');
   ```

### Safety Features

- **Production Disabled**: The bypass is automatically disabled in production builds (`import.meta.env.PROD`)
- **Console Warnings**: When enabled, clear warnings appear in browser console
- **Visual Indicator**: A prominent purple "Development Mode Active" banner appears at the top of the page

### Visual Indicator

When bypass is active, you'll see:
- A purple banner at the top of the application
- Instructions on how the bypass was activated
- Button to disable development mode
- Debug information button

### Disabling the Bypass

1. **URL Method**: Remove `?bypassAuth=1` from URL and refresh
2. **LocalStorage Method**: Run `localStorage.removeItem('DEBUG_BYPASS')` and refresh
3. **Button Method**: Click "Disable Development Mode" in the banner

### Important Notes

- This feature is **only for development/testing** and should never be used in production
- Real authentication flows remain fully functional when bypass is not active
- The bypass does not create or modify user accounts in the database
- All role-based access controls (RBAC) still apply when using bypass

---

## 📋 Prerequisites

### Test Accounts Created:

| Email            | Password          | Role    | Companies                               |
| ---------------- | ----------------- | ------- | --------------------------------------- |
| admin@admin.com  | ThermoAdmin$2026! | admin   | ThermoTech HVAC (Primary), Demo Company |
| tech@test.com    | Password123!      | tech    | ThermoTech HVAC                         |
| manager@demo.com | DemoManager123!   | manager | Demo Company                            |
| client@test.com  | Password123!      | client  | Demo Company                            |
| student@test.com | Password123!      | student | N/A                                     |

---

## 🚀 SCENARIO 1: Multi-Company Selection Flow

### Step 1: Login as Admin (Multiple Companies)

1. Navigate to http://localhost:3001/signin
2. Enter: `admin@admin.com` / `ThermoAdmin$2026!`
3. Click "Sign In"
4. **Expected:** Redirect to `/select-company`
5. **Verify:** You see company selection cards

### Step 2: Select First Company

1. Click on "ThermoTech HVAC" card
2. **Expected:** Redirect to `/dashboard`
3. **Verify:** URL shows active company context

### Step 3: Switch to Second Company

1. Click company banner (top-right) showing "ThermoTech HVAC"
2. Select "Switch Company" option
3. **Expected:** Redirect to `/select-company`
4. Click on "Demo Company" card
5. **Verify:** Dashboard loads with Demo Company context

### Step 4: Verify Role Persistence

1. Check user menu (top-right)
2. **Verify:** Shows role for current company (may differ per company)

---

## 🔗 SCENARIO 2: Invite Code System

### Step 1: Generate Invite Code (as Admin)

1. Login as `admin@admin.com`
2. Select "ThermoTech HVAC" company
3. Navigate to `/invite-team`
4. **Expected:** Invite Team page loads
5. Find "Invite Code" section
6. Click "Generate New Code"
7. **Verify:** Code appears (e.g., `HVAC-XXXXX`)
8. Copy the code for next steps

### Step 2: Test Join with Invite Code

1. Open incognito/private window
2. Navigate to http://localhost:3001/join-company
3. Enter the invite code from Step 1
4. Click "Join Company"
5. **Expected:** Success message, redirected to dashboard
6. **Verify:** User now has access to ThermoTech HVAC

### Step 3: Verify Seat Usage Updated

1. In original admin window, refresh `/invite-team`
2. **Verify:** Seat usage counter increased

### Step 4: Generate Skool-Required Code

1. In Invite Team page, toggle "Require Skool Verification"
2. Generate new code
3. **Verify:** Code shows Skool badge
4. Test joining with this code
5. **Expected:** Shows Skool verification step

---

## 👥 SCENARIO 3: Role-Based Access Control

### Step 1: Admin Full Access

1. Login as `admin@admin.com`
2. **Verify Access:**
   - ✅ `/dashboard` - Full access
   - ✅ `/settings/company` - Full access
   - ✅ `/invite-team` - Full access
   - ✅ `/dashboard/dispatch` - Full access
   - ✅ `/history` - Full access

### Step 2: Technician Limited Access

1. Login as `tech@test.com` / `Password123!`
2. **Verify Access:**
   - ✅ `/tech` - Tech dashboard accessible
   - ✅ `/tech/jobs/:id` - Job details accessible
   - ❌ `/dashboard` - Redirects to `/tech`
   - ❌ `/settings/company` - Blocked
   - ❌ `/dashboard/dispatch` - Blocked
3. **Verify:** Appropriate error/redirect messages

### Step 3: Manager Access

1. Login as `manager@demo.com` / `DemoManager123!`
2. **Verify Access:**
   - ✅ `/dashboard` - Manager dashboard
   - ✅ `/history` - Full history access
   - ❌ `/settings/company` - Owner/Admin only
   - ✅ `/invite-team` - May have limited access

---

## 🏢 SCENARIO 4: Company Settings Management

### Step 1: Access Company Settings

1. Login as admin
2. Navigate to `/settings/company`
3. **Expected:** Settings page with 5 tabs loads

### Step 2: General Tab

1. Verify company name is displayed
2. Update timezone (e.g., "America/Los_Angeles")
3. Click "Save Changes"
4. **Verify:** Success toast appears

### Step 3: Branding Tab

1. Click "Branding" tab
2. Upload a test logo (any image file)
3. Change brand color (click color picker)
4. **Verify:** Preview header updates in real-time
5. Click "Save Changes"
6. **Verify:** Logo persists after refresh

### Step 4: Notifications Tab

1. Click "Notifications" tab
2. Toggle "Review Hunter" on/off
3. Toggle "Invoice Chaser" on/off
4. Update alert phone number
5. Click "Test Alert" button
6. **Verify:** Button shows "Sent!" after workflow triggers

### Step 5: Regional Tab

1. Click "Regional" tab
2. Update Currency: "EUR"
3. Update Date Format: "dd/MM/yyyy"
4. Update Tax Rate: "20"
5. Click "Save Changes"
6. **Verify:** Values persist

### Step 6: Integrations Tab

1. Click "Integrations" tab
2. Toggle "Financing Links on PDFs"
3. Enter test financing URL
4. **Verify:** URL field appears only when enabled

### Step 7: Subscription Info Display

1. Verify badge shows current plan (Free/Starter/Pro)
2. Verify seat usage display (e.g., "3 / 5 seats used")

---

## 🎫 SCENARIO 5: Seat Limits & Subscriptions

### Step 1: Check Current Subscription

1. Login as admin
2. Navigate to `/settings/company`
3. **Verify:** Badge shows subscription tier
4. Note seat usage (e.g., "3 / 5 seats used")

### Step 2: Generate Codes Near Limit

1. Navigate to `/invite-team`
2. Keep generating invite codes
3. **Verify:** Seat counter updates
4. **Edge Case:** If at limit, generating should show warning

### Step 3: Test Invited User Access

1. Use invite code from Step 2
2. New user joins company
3. **Verify:** New user can access company
4. **Verify:** Seat usage incremented

---

## 🔐 SCENARIO 6: Invite Code Security

### Step 1: Test Expired Code

1. Try using an invite code that's past expiration
2. **Expected:** Error message "Invite code expired"

### Step 2: Test Invalid Code

1. Enter random invalid code (e.g., "XXXXX-XXXXX")
2. **Expected:** Error message "Invalid invite code"

### Step 3: Test Already Used Code

1. Use same invite code twice
2. **Expected:** Error "Code already used" or success if single-use disabled

### Step 4: Test Skool Verification Bypass

1. Create Skool-required code
2. Try to join without Skool verification
3. **Expected:** Blocked until Skool verified

---

## 🔄 SCENARIO 7: Cross-Company Operations

### Step 1: User Belongs to Multiple Companies

1. Login as `admin@admin.com` (has 2 companies)
2. **Expected:** Redirected to `/select-company`
3. Select first company, do some action
4. Switch to second company
5. **Verify:** Actions are company-isolated

### Step 2: Different Roles Per Company

1. Login as user with different roles in different companies
2. Check role in Company A
3. Switch to Company B
4. **Verify:** Role updated to Company B's assignment

---

## 📱 SCENARIO 8: UI Components

### Step 1: Company Banner

1. Login with multiple companies
2. **Verify:** Banner shows current company name
3. Click banner → dropdown shows all companies
4. **Verify:** Active company is highlighted

### Step 2: Company Selector Dropdown

1. Navigate to `/invite-team` or `/settings/company`
2. **Verify:** Title shows correct company name
3. **Verify:** Settings are company-specific

### Step 3: Role Indicator

1. Check user profile or menu
2. **Verify:** Shows current role in current company

---

## 🧪 SCENARIO 9: Edge Cases

### Step 1: No Companies Assigned

1. Create new user, don't assign to any company
2. Login
3. **Expected:** Redirect to `/join-company` or show empty state

### Step 2: Single Company Auto-Redirect

1. User has exactly 1 company
2. Login
3. **Expected:** Bypasses selection, goes directly to dashboard

### Step 3: Logged Out Mid-Session

1. While on dashboard, logout
2. Login again
3. **Expected:** Return to same company context or selection

### Step 4: Invalid Session

1. Clear localStorage/session
2. Refresh page
3. **Expected:** Redirect to login

---

## 📊 Test Checklist Template

| Test Case              | Steps | Expected                    | Actual | Pass/Fail |
| ---------------------- | ----- | --------------------------- | ------ | --------- |
| Multi-company login    | 1-4   | Redirect to /select-company |        |           |
| Company selection      | 1-2   | Dashboard loads             |        |           |
| Switch companies       | 1-4   | Context changes             |        |           |
| Generate invite        | 1-8   | Code generated              |        |           |
| Join with code         | 1-6   | User joined                 |        |           |
| Tech restricted routes | 1-3   | Blocked appropriately       |        |           |
| Settings save          | 1-6   | Changes persist             |        |           |
| Logo upload            | 1-5   | Logo displays               |        |           |
| Skool code             | 1-5   | Verification required       |        |           |

---

## 🐛 Known Issues to Test

1. **Company Selector** - May not appear if user has only 1 company
2. **Role Persistence** - Role might not update immediately after switch
3. **Seat Counter** - May need refresh to show accurate count
4. **Skool Integration** - Requires valid Skool credentials
5. **Invite Code Expiration** - Check timezone handling

---

## 📝 Notes

- Always test in **incognito/private** window for fresh sessions
- Clear cookies/localStorage between major test scenarios
- Use browser DevTools Network tab to debug API calls
- Check browser console for any errors (red text)
- Screenshots are helpful for bug reports

---

**Last Updated:** February 5, 2025  
**Test Environment:** localhost:3001
