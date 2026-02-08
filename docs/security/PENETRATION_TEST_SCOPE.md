# Penetration Testing Scope & RBAC Test Plan

**Document Version:** 1.0  
**Date:** 2026-02-07  
**Classification:** Confidential  
**Prepared For:** ThermoNeural Engineering Team

---

## 1. Executive Summary

This document outlines the comprehensive penetration testing scope and Role-Based Access Control (RBAC) test plan for the ThermoNeural HVAC-R platform. The testing scope covers all external-facing APIs, authentication mechanisms, and internal authorization controls to ensure the security posture of the application.

**Testing Objectives:**

1. Identify and remediate security vulnerabilities before production deployment
2. Validate RBAC enforcement across all user roles
3. Test authentication and session management security
4. Assess API endpoint security
5. Evaluate data isolation between tenants

**Testing Scope:**

- 27 API endpoints
- 6 user roles (Owner, Admin, Manager, Technician, Client, Student)
- Authentication flows
- Payment processing (Stripe integration)
- File upload mechanisms
- AI/ML endpoints

---

## 2. Penetration Testing Scope

### 2.1 In-Scope Components

#### API Endpoints (27 Total)

| Category | Endpoints | Testing Priority |
|----------|-----------|------------------|
| Authentication | `/api/auth/signup`, `/api/auth/signin`, `/api/auth/signout`, `/api/auth/me` | Critical |
| Calculations | `/api/calculations` (GET, POST, PUT, DELETE), `/api/user/stats` | High |
| Team Management | `/api/team` (GET, POST, PUT, DELETE) | High |
| Fleet Management | `/api/fleet/status` | Medium |
| Subscriptions | `/api/subscriptions/*` (6 endpoints) | Critical |
| Engineering | `/api/calculate-*` (5 endpoints) | High |
| Storage | `/api/storage/upload` | High |
| Diagnostics | `/api/diagnostics/*`, `/api/health` | Medium |
| AI Patterns | `/api/ai/patterns/*` (11 endpoints) | High |
| Reports | `/api/reports/generate` | Medium |

#### External Integrations

| Service | Integration Type | Testing Focus |
|---------|------------------|---------------|
| Stripe | Payment Processing | Webhook security, PCI compliance |
| Supabase | Database & Auth | RLS policies, Auth tokens |
| Resend | Email | Email injection, SPF/DKIM |
| Telnyx | SMS | SMS injection, rate limiting |
| Open-Meteo | Weather API | API key exposure, injection |
| AI Providers | LLM/Vision | Prompt injection, data leakage |

#### Infrastructure

| Component | Description | Testing Focus |
|-----------|-------------|---------------|
| Frontend | React 18 + Vite | XSS, CSRF, DOM manipulation |
| Backend | Express.js | API security, injection attacks |
| Database | PostgreSQL + Supabase | SQL injection, RLS bypass |
| Edge Functions | Deno | Serverless security |

### 2.2 Out-of-Scope Components

The following are explicitly out of scope for this penetration test:

- Third-party vendor infrastructure (Stripe, Supabase, etc.)
- Physical security assessments
- Social engineering attacks
- Denial of service testing (resource exhaustion only)
- Internal network infrastructure
- Source code review (separate activity)

### 2.3 Testing Types

#### Black Box Testing

- No internal knowledge provided
- External attacker perspective
- Focus on publicly accessible endpoints

#### Gray Box Testing

- Limited internal knowledge (user accounts for each role)
- Authentication bypass attempts
- Privilege escalation testing

#### White Box Testing

- API documentation available
- Architecture diagrams provided
- Source code access for specific components

---

## 3. Test Cases

### 3.1 Authentication Testing

| Test ID | Test Case | Severity | Expected Result |
|---------|-----------|----------|-----------------|
| AUTH-001 | Brute force login attempts | Critical | Account lockout after 5 failed attempts |
| AUTH-002 | SQL injection in login form | Critical | Input sanitized, no data exfiltration |
| AUTH-003 | JWT token manipulation | Critical | Token validation fails, 401 returned |
| AUTH-004 | Session fixation | High | New session ID on login |
| AUTH-005 | Session hijacking | Critical | Secure session cookies, HTTPS only |
| AUTH-006 | Password reset vulnerabilities | High | Secure token generation, rate limiting |
| AUTH-007 | MFA bypass attempts | Critical | MFA enforced for sensitive actions |
| AUTH-008 | OAuth token leakage | High | Tokens not exposed in URLs |
| AUTH-009 | Account enumeration | Medium | Generic error messages |
| AUTH-010 | Privilege escalation via auth | Critical | Role cannot be changed by user |

### 3.2 Authorization & RBAC Testing

| Test ID | Test Case | Severity | Expected Result |
|---------|-----------|----------|-----------------|
| RBAC-001 | Owner accessing Admin resources | High | Access denied |
| RBAC-002 | Admin accessing Manager resources | High | Access denied |
| RBAC-003 | Manager accessing Technician resources | Medium | Access denied |
| RBAC-004 | Technician accessing Client resources | Medium | Access denied |
| RBAC-005 | Cross-company data access | Critical | RLS prevents access |
| RBAC-006 | Role privilege escalation | Critical | Role changes require Admin approval |
| RBAC-007 | API endpoint authorization bypass | Critical | Proper 403 for unauthorized access |
| RBAC-008 | IDOR on calculation endpoints | High | 403 for other users' calculations |
| RBAC-009 | IDOR on team management | High | Cannot modify other company members |
| RBAC-010 | Subscription tier bypass | Critical | Feature access controlled by backend |

### 3.3 API Security Testing

| Test ID | Test Case | Severity | Expected Result |
|---------|-----------|----------|-----------------|
| API-001 | Mass assignment vulnerabilities | High | Only allowed fields accepted |
| API-002 | Parameter tampering | High | Input validation, proper error handling |
| API-003 | SQL injection via parameters | Critical | Parameterized queries, no injection |
| API-004 | NoSQL injection | Critical | Input sanitization |
| API-005 | Command injection | Critical | No OS command execution |
| API-006 | XXE injection | Critical | XML parsing disabled/safe |
| API-007 | JSON injection | High | Input validation |
| API-008 | API versioning bypass | Medium | Version enforced |
| API-009 | Rate limiting bypass | High | Rate limits enforced |
| API-010 | Request smuggling | High | Proper request parsing |

### 3.4 Input Validation Testing

| Test ID | Test Case | Severity | Expected Result |
|---------|-----------|----------|-----------------|
| INP-001 | XSS in calculation inputs | Critical | Input sanitized, output encoded |
| INP-002 | Stored XSS in reports | Critical | Content sanitized |
| INP-003 | Reflected XSS in error messages | High | Output encoded |
| INP-004 | File path traversal | High | Paths normalized, access restricted |
| INP-005 | File upload malicious content | Critical | File type validation, malware scanning |
| INP-006 | CSV injection | Medium | Input sanitization |
| INP-007 | LDAP injection | High | LDAP sanitization |
| INP-008 | Template injection | Critical | Safe template rendering |
| INP-009 | SSRF via file upload | Critical | URL validation, network restrictions |
| INP-010 | Prototype pollution | High | Object prototype not modifiable |

### 3.5 Business Logic Testing

| Test ID | Test Case | Severity | Expected Result |
|---------|-----------|----------|-----------------|
| BIZ-001 | Subscription downgrade bypass | High | Proper tier enforcement |
| BIZ-002 | Calculation result manipulation | Medium | Results validated server-side |
| BIZ-003 | Invoice generation tampering | High | Invoice data validated |
| BIZ-004 | Payment replay attacks | Critical | Unique transaction IDs |
| BIZ-005 | Price manipulation | Critical | Prices from server, not client |
| BIZ-006 | Quantity manipulation | High | Server-side quantity validation |
| BIZ-007 | Coupon code abuse | Medium | Usage limits enforced |
| BIZ-008 | Referral system abuse | Medium | Anti-fraud measures |
| BIZ-009 | Rate limit abuse | Medium | Proper rate limiting |
| BIZ-010 | Multi-tenancy bypass | Critical | Company isolation enforced |

### 3.6 File Upload Testing

| Test ID | Test Case | Severity | Expected Result |
|---------|-----------|----------|-----------------|
| FILE-001 | Malicious file upload | Critical | File type validation, malware scan |
| FILE-002 | File extension bypass | High | Content-based validation |
| FILE-003 | File size limit bypass | Medium | Server-side size limits |
| FILE-004 | Path traversal in upload | High | Safe file paths |
| FILE-005 | Uploaded file execution | Critical | No execution of uploaded files |
| FILE-006 | MIME type spoofing | High | Content validation |
| FILE-007 | Archive bomb (zip of death) | Medium | Decompression limits |
| FILE-008 | Symlink attacks | High | No symlink following |

### 3.7 AI/ML Endpoint Testing

| Test ID | Test Case | Severity | Expected Result |
|---------|-----------|----------|-----------------|
| AI-001 | Prompt injection | High | Input sanitization, output filtering |
| AI-002 | Data leakage via prompts | High | No sensitive data in responses |
| AI-003 | Model manipulation | Medium | Consistent model behavior |
| AI-004 | Token exhaustion | Medium | Request size limits |
| AI-005 | Response manipulation | Medium | Response validation |
| AI-006 | Vision model bypass | High | Safe image processing |
| AI-007 | Pattern injection | Medium | Input validation |
| AI-008 | Cost manipulation | Medium | Usage tracking, limits |

---

## 4. RBAC Test Matrix

### 4.1 Role Hierarchy

```
Owner (Level 1)
  ├── Admin (Level 2)
  │     ├── Manager (Level 3)
  │     │     ├── Technician (Level 4)
  │     │     │     ├── Client (Level 5)
  │     │     │     └── Student (Level 6)
```

### 4.2 Permission Matrix

| Resource | Owner | Admin | Manager | Technician | Client | Student |
|----------|-------|-------|---------|------------|--------|---------|
| **Calculations** |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Read (own) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read (team) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update (own) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Delete (own) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Jobs** |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Read (own) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Read (team) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Team** |
| Invite | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update Role | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Billing** |
| View Invoices | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Subscription | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reports** |
| Generate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Team Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **AI Features** |
| Troubleshooting | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Pattern Creation | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### 4.3 RBAC Test Scenarios

#### Test RBAC-001: Vertical Privilege Escalation

**Objective:** Verify users cannot access resources of higher-privileged roles

**Test Steps:**

1. Create accounts for each role
2. Attempt Technician to access Manager resources
3. Attempt Manager to access Admin resources
4. Attempt Admin to access Owner resources

**Expected Results:**

- All access attempts return 403 Forbidden
- Audit logs capture unauthorized access attempts

#### Test RBAC-002: Horizontal Privilege Escalation

**Objective:** Verify users cannot access resources of other users at same level

**Test Steps:**

1. Create two Technician accounts in different companies
2. Attempt Technician A to access Technician B's calculations
3. Attempt Technician A to modify Technician B's jobs

**Expected Results:**

- All access attempts return 403 Forbidden
- RLS policies prevent cross-company access

#### Test RBAC-003: Cross-Company Data Access

**Objective:** Verify multi-tenant isolation

**Test Steps:**

1. Create accounts in two different companies
2. Attempt to access company A resources while authenticated as company B
3. Attempt to modify cross-company data

**Expected Results:**

- All cross-company access attempts fail
- RLS policies enforced at database level

#### Test RBAC-004: Role Permission Validation

**Objective:** Verify each role has correct permissions

**Test Steps:**

1. For each role, test all permissions in matrix
2. Verify allowed actions succeed
3. Verify disallowed actions fail

**Expected Results:**

- 100% alignment with permission matrix
- No unexpected permissions granted

---

## 5. Testing Methodology

### 5.1 Phases

#### Phase 1: Reconnaissance (1 day)

- API endpoint discovery
- Technology stack identification
- Authentication mechanism analysis
- Third-party service enumeration

#### Phase 2: Authentication Testing (2 days)

- Login mechanism testing
- Session management testing
- Token validation testing
- MFA bypass attempts

#### Phase 3: Authorization Testing (3 days)

- RBAC testing (all 6 roles)
- IDOR testing
- Privilege escalation attempts
- Multi-tenant isolation testing

#### Phase 4: API Security Testing (3 days)

- Input validation testing
- Injection testing
- Business logic testing
- Rate limiting testing

#### Phase 5: File Upload Testing (1 day)

- File type validation
- Malicious file detection
- Path traversal testing
- Content validation

#### Phase 6: AI/ML Testing (1 day)

- Prompt injection testing
- Data leakage testing
- Model manipulation testing

#### Phase 7: Reporting (1 day)

- Vulnerability documentation
- Risk assessment
- Remediation recommendations
- Executive summary

### 5.2 Tools

| Tool | Purpose |
|------|---------|
| Burp Suite Pro | API testing, intercepting proxy |
| OWASP ZAP | Automated scanning, fuzzing |
| Nmap | Port scanning, service enumeration |
| SQLMap | SQL injection detection |
| Nuclei | Automated vulnerability scanning |
| Postman | API endpoint testing |
| JWT.io | JWT token analysis |
| Gobuster | Directory enumeration |
| Amass | Subdomain enumeration |
| Custom scripts | RBAC testing automation |

### 5.3 Environment

| Environment | URL | Notes |
|-------------|-----|-------|
| Staging | <https://api-staging.thermoneural.com> | Primary testing environment |
| Development | <http://localhost:3001> | Local testing |
| Test Accounts | See Appendix A | Pre-created test accounts |

---

## 6. Deliverables

### 6.1 During Testing

| Deliverable | Frequency | Format |
|-------------|-----------|--------|
| Daily Status Report | Daily | Email |
| Critical Findings | Immediate | Email + Slack |
| Weekly Summary | Weekly | PDF Report |

### 6.2 Final Deliverables

| Deliverable | Description |
|-------------|-------------|
| Executive Summary | High-level overview for management |
| Technical Report | Detailed findings with evidence |
| Risk Matrix | CVSS-scored vulnerabilities |
| Remediation Guide | Step-by-step fix instructions |
| Retest Plan | Verification procedures |
| Raw Data | All test results and logs |

---

## 7. Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Reconnaissance | 1 day | Week 5, Day 1 | Week 5, Day 1 |
| Authentication Testing | 2 days | Week 5, Day 2 | Week 5, Day 3 |
| Authorization Testing | 3 days | Week 5, Day 4 | Week 5, Day 6 |
| API Security Testing | 3 days | Week 6, Day 1 | Week 6, Day 3 |
| File Upload Testing | 1 day | Week 6, Day 4 | Week 6, Day 4 |
| AI/ML Testing | 1 day | Week 6, Day 5 | Week 6, Day 5 |
| Reporting | 1 day | Week 6, Day 6 | Week 6, Day 6 |

**Total Duration:** 12 business days  
**Estimated Completion:** End of Week 6

---

## 8. Risk Management

### 8.1 Testing Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data corruption during testing | High | Test on staging only, backup before tests |
| Service disruption | Medium | Schedule intensive tests during off-peak |
| False positives | Medium | Manual verification of all findings |
| Scope creep | Low | Strict change control process |

### 8.2 Emergency Procedures

**If critical vulnerability found:**

1. Immediately notify security team
2. Document and isolate finding
3. Assess exploitability
4. Implement emergency patch if needed

**If service disruption occurs:**

1. Stop testing immediately
2. Notify operations team
3. Document incident
4. Resume after service restored

---

## 9. Communication Plan

### 9.1 Stakeholders

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| Project Sponsor | TBD | <tbd@thermoneural.com> | Budget approval |
| Security Lead | TBD | <security@thermoneural.com> | Technical oversight |
| Engineering Lead | TBD | <engineering@thermoneural.com> | Remediation |
| DevOps Lead | TBD | <devops@thermoneural.com> | Environment access |

### 9.2 Communication Schedule

| Event | Channel | Recipients | Timing |
|-------|---------|------------|--------|
| Daily status | Email | All stakeholders | 5:00 PM daily |
| Critical finding | Slack + Email | All stakeholders | Immediate |
| Weekly summary | PDF Report | All stakeholders | Friday 5:00 PM |
| Final report | PDF + Presentation | Executive team | Week 7, Day 1 |

---

## 10. Appendices

### Appendix A: Test Accounts

| Role | Email | Password | Company |
|------|-------|----------|---------|
| Owner | <owner@test.thermoneural.com> | TestPass123! | Company A |
| Admin | <admin@test.thermoneural.com> | TestPass123! | Company A |
| Manager | <manager@test.thermoneural.com> | TestPass123! | Company A |
| Technician | <tech@test.thermoneural.com> | TestPass123! | Company A |
| Client | <client@test.thermoneural.com> | TestPass123! | Company A |
| Student | <student@test.thermoneural.com> | TestPass123! | Company A |
| Owner (Company B) | <owner2@test.thermoneural.com> | TestPass123! | Company B |

### Appendix B: API Documentation

See: `docs/api/openapi.yaml`

### Appendix C: Architecture Diagrams

See: `docs/architecture/`

### Appendix D: Environment Variables Required

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

## 11. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Sponsor | _________________ | ______________ | __________ |
| Security Lead | _________________ | ______________ | __________ |
| Engineering Lead | _________________ | ______________ | __________ |

---

*Document Version: 1.0*  
*Next Review: 2026-03-07*  
*Document Owner: Security Team*
