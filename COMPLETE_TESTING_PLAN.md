# HVAC-R Application - Complete Testing Guide

**Environment:** http://localhost:3001  
**Last Updated:** February 5, 2025  
**Test Duration:** 2-3 hours for full suite

---

## 📋 Test Credentials

| Role       | Email             | Password          | Notes                             |
| ---------- | ----------------- | ----------------- | --------------------------------- |
| Admin      | admin@admin.com   | ThermoAdmin$2026! | Multi-company (ThermoTech + Demo) |
| Technician | tech@test.com     | Password123!      | Single company                    |
| Manager    | manager@demo.com  | DemoManager123!   | Demo Company                      |
| Owner      | owner@owner.com   | OwnerPass123!     | Owner Company                     |
| Client     | client@client.com | ClientPass123!    | Portal access only                |

---

## 🚀 PHASE 1: Authentication & Multi-Company (30 min)

### Test 1.1: Login Flow

**Steps:**

1. Open http://localhost:3001/signin in incognito window
2. Login with admin credentials
3. Observe redirect behavior

**Expected Results:**

- ✅ Redirects to `/select-company` (multi-company user)
- ✅ Company cards displayed
- ✅ No infinite loading or errors

**Verification:**

```bash
# Manual check - look for:
1. Company selection cards visible
2. No flashing notifications
3. Page loads within 3 seconds
```

### Test 1.2: Single Company Auto-Login

**Steps:**

1. Login with `tech@test.com`
2. Observe redirect

**Expected Results:**

- ✅ Direct redirect to `/dashboard` (no selection needed)
- ✅ Dashboard loads without flashing

### Test 1.3: Company Switching

**Steps:**

1. As admin, select "ThermoTech HVAC"
2. Navigate to dashboard
3. Click company banner (top-right)
4. Select "Switch Company"
5. Choose "Demo Company"

**Expected Results:**

- ✅ Redirects to `/select-company`
- ✅ Other company selected
- ✅ Dashboard loads with new company context
- ✅ Role persists correctly

---

## 🔗 PHASE 2: Invite Code System (30 min)

### Test 2.1: Generate Invite Code

**Steps:**

1. Login as admin, select ThermoTech HVAC
2. Navigate to `/invite-team`
3. Find "Invite Code" section
4. Click "Generate New Code"
5. Copy the code

**Expected Results:**

- ✅ Code generates (format: `HVAC-XXXXX`)
- ✅ Code appears with copy button
- ✅ Seat counter updates

### Test 2.2: Join with Invite Code

**Steps:**

1. Open new incognito window
2. Navigate to http://localhost:3001/join-company
3. Enter invite code from Test 2.1
4. Submit

**Expected Results:**

- ✅ Success message appears
- ✅ Redirected to dashboard
- ✅ Now has access to company

### Test 2.3: Seat Limit Enforcement

**Steps:**

1. As admin, check `/invite-team` seat usage
2. Generate multiple codes until near limit
3. Attempt to use expired/used code

**Expected Results:**

- ✅ Seat counter accurate
- ✅ Warning shown when approaching limit
- ✅ Expired codes show error

### Test 2.4: Skool Integration

**Steps:**

1. On `/invite-team`, toggle "Require Skool Verification"
2. Generate code
3. Attempt to join without Skool

**Expected Results:**

- ✅ Code marked as Skool-required
- ✅ Verification step appears on join
- ✅ Blocked until verified

---

## 👥 PHASE 3: Role-Based Access Control (30 min)

### Test 3.1: Admin Full Access

**Login:** admin@admin.com

**Test Routes:**
| Route | Expected | Check |
|-------|----------|-------|
| `/dashboard` | ✅ Full access | Dashboard loads |
| `/settings/company` | ✅ Full access | Settings save |
| `/invite-team` | ✅ Full access | Can generate codes |
| `/dashboard/dispatch` | ✅ Full access | Dispatch loads |
| `/history` | ✅ Full access | History displays |

### Test 3.2: Technician Limited Access

**Login:** tech@test.com

**Test Routes:**
| Route | Expected | Actual |
|-------|----------|--------|
| `/dashboard` | ❌ Redirect to `/tech` | |
| `/tech` | ✅ Tech dashboard | |
| `/tech/jobs/:id` | ✅ Job details | |
| `/settings/company` | ❌ Blocked | |
| `/dashboard/dispatch` | ❌ Blocked | |

### Test 3.3: Manager Access

**Login:** manager@demo.com

**Test Routes:**
| Route | Expected |
|-------|----------|
| `/dashboard` | ✅ Full access |
| `/history` | ✅ Full access |
| `/settings/company` | ❌ Owner/Admin only |
| `/invite-team` | ⚠️ Limited (generate only) |

### Test 3.4: Client Portal Access

**Login:** client@client.com

**Test Routes:**
| Route | Expected |
|-------|----------|
| `/portal` | ✅ Client dashboard |
| `/track-job/:id` | ✅ Job tracking |
| `/history` | ❌ Blocked |

---

## 🏢 PHASE 4: Company Settings (30 min)

### Test 4.1: General Settings

**Steps:**

1. Login as admin
2. Navigate to `/settings/company`
3. Click "General" tab
4. Update timezone
5. Save

**Expected Results:**

- ✅ Settings load without errors
- ✅ Save completes successfully
- ✅ Toast appears once (not repeated)

### Test 4.2: Branding Settings

**Steps:**

1. Click "Branding" tab
2. Upload test logo
3. Change brand color
4. Verify preview updates

**Expected Results:**

- ✅ Logo uploads successfully
- ✅ Color picker works
- ✅ Preview shows changes in real-time
- ✅ No flashing during save

### Test 4.3: Notifications Tab

**Steps:**

1. Click "Notifications" tab
2. Toggle Review Hunter
3. Toggle Invoice Chaser
4. Click "Test Alert" button

**Expected Results:**

- ✅ Toggles respond immediately
- ✅ Test Alert shows "Sent!" after trigger
- ✅ Settings save correctly

### Test 4.4: Regional Settings

**Steps:**

1. Click "Regional" tab
2. Update Currency, Date Format, Tax Rate
3. Save

**Expected Results:**

- ✅ All fields save
- ✅ Values persist on reload

### Test 4.5: Subscription Display

**Steps:**

1. Verify badge shows tier (Free/Starter/Pro)
2. Verify seat usage (e.g., "3 / 5 seats used")

**Expected Results:**

- ✅ Badge displays correct tier
- ✅ Seat counter accurate
- ✅ No flashing on load

---

## 📊 PHASE 5: Dashboard Performance (15 min)

### Test 5.1: Dashboard Load

**Steps:**

1. Login as admin
2. Navigate to `/dashboard`
3. Observe for 10 seconds

**Expected Results:**

- ✅ No repeated toast notifications
- ✅ No flashing content
- ✅ Dashboard stabilizes within 3 seconds
- ✅ Stats load without repeated loading states

**Manual Check:**

```
Open browser DevTools > Console
Look for:
- "calculations:updated event" - should not appear rapidly
- Toast notifications - should appear at most once
- Loading spinners - should not flicker
```

### Test 5.2: Navigation Performance

**Steps:**

1. Navigate between pages
2. Time each page load

**Expected Results:**

- ✅ All pages load within 2 seconds
- ✅ No excessive re-renders
- ✅ Console clean of errors

---

## 🔐 PHASE 6: Security Tests (15 min)

### Test 6.1: Session Persistence

**Steps:**

1. Login, navigate to dashboard
2. Refresh page (F5)
3. Check if still logged in

**Expected Results:**

- ✅ Session persists
- ✅ No login redirect

### Test 6.2: Invalid Session

**Steps:**

1. Open new incognito
2. Navigate directly to `/dashboard`
3. Observe redirect

**Expected Results:**

- ✅ Redirects to `/signin`
- ✅ No content leak

### Test 6.3: SQL Injection Prevention

**Steps:**

1. In invite code field, enter: `' OR '1'='1`
2. Submit

**Expected Results:**

- ✅ Error message (not system error)
- ✅ No data exposed

---

## 🧪 PHASE 7: E2E Test Suite Run (30 min)

### Test 7.1: Run Multi-Company Tests

```bash
cd /Users/riad/hvacR/HVAC-R
npm run test:e2e -- e2e/multi-company.spec.ts
```

**Expected:** All 9 tests pass

### Test 7.2: Run Full Test Suite

```bash
npm run test:e2e -- --project=chromium
```

**Expected Results:**

```
Total: 162 tests
Passed: 162
Failed: 0
Skipped: 0
```

---

## 📝 Test Execution Checklist

### Before Starting

- [ ] Dev server running (`npm run dev`)
- [ ] Supabase connected and migrations applied
- [ ] Test credentials ready
- [ ] Browser DevTools open for monitoring

### During Testing

- [ ] Log all failures with steps to reproduce
- [ ] Take screenshots of errors
- [ ] Note console messages
- [ ] Track time per phase

### After Testing

- [ ] All tests documented
- [ ] Bugs logged with severity
- [ ] Performance metrics recorded
- [ ] Recommendations for fixes

---

## 🐛 Known Issues & Expected Behaviors

### Issue 1: Dashboard Flashing (FIXED)

**Before:** Multiple toast notifications, content flashing  
**After:** Toast appears at most once, no flashing  
**Verification:** Monitor console for "calculations:updated" events

### Issue 2: Invite Code Generation Delay

**Expected:** 1-2 second delay when generating codes  
**Not a bug:** API call to database required

### Issue 3: Subscription Tier Display

**Expected:** Shows "Free" if billing not configured  
**Not a bug:** Billing API requires VITE_BILLING_ENABLED=true

---

## 📈 Performance Benchmarks

| Metric          | Target   | Acceptable | Poor    |
| --------------- | -------- | ---------- | ------- |
| Dashboard Load  | <2s      | <3s        | >3s     |
| Page Navigation | <1s      | <2s        | >2s     |
| API Response    | <500ms   | <1s        | >1s     |
| Toast Frequency | 0-1/page | 2-3/page   | >3/page |
| Re-renders      | 1-2      | 3-5        | >5      |

---

## 🔧 Troubleshooting

### Dev Server Not Starting

```bash
# Kill existing processes
lsof -ti:3001 | xargs kill -9

# Restart
npm run dev
```

### Tests Failing

```bash
# Clear Playwright cache
rm -rf playwright/.auth
rm -rf test-results

# Re-run tests
npm run test:e2e
```

### Database Issues

```bash
# Check Supabase connection
# Verify migrations in order:
# 1. 20250205000000_multi_company_core.sql
# 2. 20260206000001_invite_codes_rls.sql
# 3. 20260206000002_seat_limits.sql
# 4. 20260206000003_audit_logs.sql
# 5. 20260206000004_company_settings.sql
```

---

## 📞 Reporting Bugs

For each bug found:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshot/console output
5. Browser/version used

**Bug Severity:**

- **Critical:** App crash, data loss, security breach
- **High:** Feature broken, major UX issue
- **Medium:** Feature impaired, workaround exists
- **Low:** Cosmetic, minor UX issue

---

## ✅ Sign-Off Criteria

All phases must pass:

- [ ] Phase 1: Auth & Multi-Company (all tests pass)
- [ ] Phase 2: Invite Codes (all tests pass)
- [ ] Phase 3: RBAC (all access tests pass)
- [ ] Phase 4: Settings (all tabs work)
- [ ] Phase 5: Performance (within benchmarks)
- [ ] Phase 6: Security (no vulnerabilities)
- [ ] Phase 7: E2E Suite (162/162 pass)

**Test Lead Signature:** ********\_********  
**Date:** ********\_********
