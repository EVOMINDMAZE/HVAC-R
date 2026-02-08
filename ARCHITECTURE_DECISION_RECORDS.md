# Architecture Decision Records (ADR)

## Overview
This document records key architectural decisions made during the ThermoNeural HVAC-R platform development. Each ADR follows the template: Context, Decision, Consequences, Status.

---

## ADR-001: Supabase as Primary Backend

**Date:** 2025-12-15  
**Status:** Accepted ✅

### Context
Needed a backend that could handle authentication, database, storage, and real-time features while maintaining rapid development velocity. Considered alternatives: Firebase, AWS Amplify, custom Node.js/PostgreSQL.

### Decision
Use Supabase as the primary backend with PostgreSQL database, built-in authentication, Row Level Security (RLS), storage, and edge functions. Maintain a minimal Express.js server for legacy calculations and specific integrations.

### Consequences
**Positive:**
- Rapid development with auto-generated APIs
- Built-in multi-tenancy via RLS policies
- Real-time subscriptions out of the box
- Free tier sufficient for initial development

**Negative:**
- Vendor lock-in to Supabase ecosystem
- Learning curve for RLS policy debugging
- Some complexity with edge function deployment

---

## ADR-002: React 18 with TypeScript

**Date:** 2025-12-20  
**Status:** Accepted ✅

### Context
Frontend framework needed to support complex interactive calculations, real-time updates, and maintainable codebase. Considered alternatives: Vue 3, Svelte, Angular.

### Decision
Use React 18 with TypeScript strict mode, leveraging modern React features (hooks, suspense, concurrent features). Combine with Vite for fast builds and Hot Module Replacement.

### Consequences
**Positive:**
- Strong type safety reduces runtime errors
- Rich ecosystem of UI libraries (Shadcn UI, Radix)
- Concurrent features enable smooth UX during calculations
- Vite provides exceptional development experience

**Negative:**
- TypeScript configuration complexity
- Bundle size larger than alternatives
- React learning curve for new developers

---

## ADR-003: Hybrid Computation Architecture

**Date:** 2025-12-25  
**Status:** Accepted ✅

### Context
Physics calculations range from simple (client-side) to complex (requires Python/CoolProp). Need to balance responsiveness with computational accuracy.

### Decision
Implement three-tier computation architecture:
1. **Client-side:** Immediate feedback for simple calculations (superheat, subcooling)
2. **Server-side (Render):** Complex engineering calculations requiring Python libraries
3. **Edge Functions:** AI processing, automations, and lightweight computations

### Consequences
**Positive:**
- Users get immediate feedback for common calculations
- Complex calculations still available with slight delay
- Scalable architecture distributes computational load

**Negative:**
- Code duplication between client and server
- Error handling complexity across boundaries
- Deployment coordination across multiple services

---

## ADR-004: Multi-Tenant Row Level Security

**Date:** 2025-12-28  
**Status:** Accepted ✅

### Context
Platform serves multiple HVAC companies with strict data isolation requirements. Need secure, performant multi-tenancy solution.

### Decision
Implement multi-tenancy using PostgreSQL Row Level Security (RLS) with company-based policies. Use helper functions (`get_my_company_id()`, `get_my_role()`) to simplify policy creation.

### Consequences
**Positive:**
- Database-level security guarantees data isolation
- SQL-based policies are declarative and auditable
- Works with any Supabase client (JavaScript, Python, etc.)
- Performance optimized with proper indexes

**Negative:**
- Complex debugging when policies conflict
- 30+ migrations required to fix recursion issues
- Learning curve for team members unfamiliar with RLS

---

## ADR-005: Capacitor for Mobile

**Date:** 2026-01-05  
**Status:** Accepted ✅

### Context
Need mobile app for technicians in the field without internet access. Considered alternatives: React Native, Flutter, Progressive Web App only.

### Decision
Use Capacitor to wrap the PWA as native Android/iOS apps, enabling offline calculator access and native device features (camera, biometrics).

### Consequences
**Positive:**
- Single codebase for web and mobile
- Offline capability via service workers
- Access to native device APIs
- Faster development than React Native

**Negative:**
- Performance limitations for complex animations
- App store approval process required
- Larger app size than native alternatives

---

## ADR-006: Unified AI Gateway Pattern

**Date:** 2026-01-15  
**Status:** Accepted ✅

### Context
Multiple AI services needed: LLM diagnostics, vision analysis, pattern recognition. Need consistent interface and error handling.

### Decision
Create a unified AI Gateway edge function that routes requests to appropriate AI providers (DeepSeek, Grok-2-Vision) with consistent error handling, rate limiting, and logging.

### Consequences
**Positive:**
- Single point of configuration for AI providers
- Consistent error handling across AI features
- Easy to switch or add new AI providers
- Centralized cost tracking

**Negative:**
- Single point of failure for all AI features
- Increased latency for some requests
- Gateway complexity increases with new features

---

## ADR-007: Event-Driven Automation

**Date:** 2026-01-20  
**Status:** Accepted ✅

### Context
Business processes require automation (review requests, invoice follow-ups, IoT polling). Need scalable, maintainable automation system.

### Decision
Use Supabase database triggers to invoke edge functions for event-driven automation. Combine with scheduled functions (cron) for periodic tasks.

### Consequences
**Positive:**
- Decoupled architecture (events vs. processing)
- Scalable via edge function isolation
- Easy to add new automations
- Real-time responsiveness

**Negative:**
- Debugging distributed events is challenging
- Error handling requires careful design
- Database trigger overhead on write operations

---

## ADR-008: Feature-Based Subscription Model

**Date:** 2026-01-25  
**Status:** Accepted ✅

### Context
Need monetization strategy that aligns with user value. Considered alternatives: seat-based pricing, usage-based pricing, flat rate.

### Decision
Implement feature-based subscription tiers using Stripe:
- **Free:** Basic calculators, single company
- **Pro:** Advanced calculators, multi-company, basic automation
- **Enterprise:** AI features, advanced automation, API access

### Consequences
**Positive:**
- Users pay for features they value
- Easy to understand pricing
- Stripe handles compliance and billing
- Webhooks for real-time subscription updates

**Negative:**
- Complex feature gating implementation
- Stripe integration overhead
- Need to manage subscription state in database

---

## ADR-009: Offline-First PWA Architecture

**Date:** 2026-01-30  
**Status:** Accepted ✅

### Context
Technicians need access to calculators in areas with poor internet connectivity.

### Decision
Implement offline-first Progressive Web App with service workers caching calculator logic and static assets. Use IndexedDB for local data storage when offline.

### Consequences
**Positive:**
- Calculators work without internet
- Fast loading from cache
- Native app-like experience
- Automatic updates when online

**Negative:**
- Service worker debugging complexity
- Cache invalidation challenges
- Storage limits on mobile devices

---

## ADR-010: TypeScript Strict Mode

**Date:** 2026-02-01  
**Status:** Accepted ✅

### Context
Growing codebase needed enhanced type safety to prevent runtime errors.

### Decision
Enable TypeScript strict mode with all strict flags enabled. Use explicit typing throughout the codebase.

### Consequences
**Positive:**
- Catches potential runtime errors at compile time
- Better IDE support and autocomplete
- Self-documenting code through types
- Easier refactoring

**Negative:**
- Initial migration required fixing hundreds of type errors
- Some third-party libraries lack proper TypeScript definitions
- Development speed slightly reduced by type annotations

---

## Summary of Key Decisions

| Decision | Category | Impact | Confidence |
|----------|----------|---------|------------|
| Supabase Backend | Infrastructure | High | High |
| React + TypeScript | Frontend | High | High |
| Hybrid Computation | Architecture | Medium | Medium |
| RLS Multi-tenancy | Security | High | High |
| Capacitor Mobile | Mobile | Medium | Medium |
| AI Gateway | AI/ML | Medium | High |
| Event-Driven Automation | Architecture | Medium | High |
| Feature Subscriptions | Business | High | High |
| Offline-First PWA | UX | High | High |
| TypeScript Strict | Code Quality | Medium | High |

## Decision Review Process
1. **Proposal:** Document decision with context and alternatives
2. **Discussion:** Team review with pros/cons analysis
3. **Decision:** Consensus or lead architect decision
4. **Implementation:** Code changes with ADR reference
5. **Review:** Periodic review of decision effectiveness

---
**Last Updated:** 2026-02-07  
**Maintainer:** Lead Architect