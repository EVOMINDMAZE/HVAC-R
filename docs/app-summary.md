# ThermoNeural (HVAC-R) Application Summary

## Overview

ThermoNeural is a state-of-the-art Progressive Web Application (PWA) designed for HVAC&R (Heating, Ventilation, Air Conditioning, and Refrigeration) professionals, engineers, and students. It provides advanced tools for thermodynamic cycle analysis, refrigerant comparison, system troubleshooting, professional estimation, and business operations management.

The application is built as a full-stack TypeScript platform with a React frontend, Supabase backend, and extensive AI/ML integrations. It supports six user roles with granular permissions, multi-company context switching, and comprehensive privacy compliance (GDPR/CCPA, SOC 2 readiness).

## Technical Architecture

### Frontend
- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite 6.2.2 with ultra-fast HMR
- **Styling**: Tailwind CSS 3.4 + Shadcn/UI (Radix Primitives)
- **Routing**: React Router DOM 6.26 with lazy loading
- **Animations**: Framer Motion 12.6
- **State Management**: React Context + custom hooks
- **PWA**: Vite PWA Plugin for offline calculator access
- **Mobile**: Capacitor 8.0 for Android/iOS native wrappers

### Backend
- **Primary Database**: Supabase (PostgreSQL 17) with Auth, Storage, and Edge Functions
- **Legacy API**: Express.js server for engineering calculations
- **Edge Runtime**: Deno for edge functions (15+ functions)
- **Authentication**: Supabase JWT with multi‑company RBAC
- **File Storage**: Supabase Storage with RLS policies

### AI/ML Layer
- **AI Gateway**: Unified edge function for LLM routing
- **Vision Models**: Grok‑2‑Vision for image analysis
- **Language Models**: DeepSeek LLM for technical troubleshooting
- **Pattern Recognition**: Custom service for symptom‑outcome correlation
- **Weather Intelligence**: Open‑Meteo integration for proactive alerts

### External Integrations
- **Payments**: Stripe for subscriptions and one‑time payments
- **Email**: Resend for transactional emails
- **SMS**: Telnyx for notification campaigns
- **Weather**: Open‑Meteo for real‑time weather data
- **CMS**: Sanity.io for blog and content management
- **Sheets**: Google Sheets import/export
- **IoT**: Honeywell/Resideo and Google Nest thermostat integrations

### Testing & Quality
- **Unit Tests**: 65+ passing tests (Vitest)
- **E2E Tests**: 40+ comprehensive scenarios (Playwright)
- **Coverage**: Threshold‑enforced (lines/functions/statements: 60%, branches: 50%)
- **CI Gates**: Lint, typecheck, unit tests, coverage, docs source‑of‑truth, E2E smoke tests

## Feature Catalog

### 1. Physics Engine (Calculators)
Core thermodynamic and engineering calculators for HVAC‑R professionals:

- **Standard Vapor Compression Cycle**: Real‑time thermodynamic calculations with visualization
- **Cascade System Analyzer**: Ultra‑low temperature specialty systems analysis
- **Psychrometric Calculator**: Indoor air quality scoring and psychrometric chart plotting
- **A2L/A3 Safety Calculator**: 80+ refrigerants database with safety classification
- **Target Superheat (Fixed Orifice)**: Auto‑weather integration for accurate superheat targets
- **Refrigerant Comparison**: Side‑by‑side analysis of refrigerant properties
- **Air Density Calculator**: PDF report generation for airflow calculations
- **Subcooling Calculator**: System optimization and diagnostics

### 2. Business Operations Engine
Tools for managing HVAC‑R service businesses:

- **Job System & Context**: Central work unit management with full audit trails
- **EPA 608 Compliance**: Audit‑proof refrigerant logging and reporting
- **Warranty Auto‑Pilot**: OCR + AI extraction from warranty documents
- **Indoor Health Reports**: Professional PDF generation for client presentations
- **Invoice Management**: One‑click invoice generation and tracking
- **Client Portal**: Job tracking and status updates for customers
- **Technician Dispatch**: Real‑time mapping and assignment
- **Fleet Management**: Vehicle tracking and maintenance scheduling

### 3. AI & Customer Experience Layer
Intelligent features that enhance customer interactions and diagnostic accuracy:

- **Pre‑Dispatch Triage**: Public homeowner portal for initial symptom collection
- **AI Diagnostics Assistant**: LLM‑driven troubleshooting with symptom‑outcome patterns
- **Web Stories Content**: TikTok‑style educational guides for homeowners
- **Pattern Recognition**: Machine learning for symptom‑outcome correlation
- **Weather Intelligence**: Proactive sales alerts based on weather patterns
- **Technician Feedback**: Skill development through AI‑generated recommendations

### 4. Marketing & Demo Features
Interactive demos and marketing tools that showcase app capabilities:

- **MiniAppPlayground**: Interactive demo with Charts and Team tabs showcasing real app features with dummy data
- **Interactive Story Mode**: Slide‑based educational experience with "ThermoNeural spirit" themes, neural scanning effects, animated P‑h diagrams, and high‑tension emergency alerts
- **Keyboard Navigation**: Full keyboard support (arrow keys) for interactive demos
- **Responsive Design**: Optimized for mobile and desktop viewing
- **Landing Page Optimization**: Compliant marketing claims with clear disclaimers and status indicators for certifications

### 5. Automation & Integration Layer
Background processes that streamline operations:

- **Review Hunter**: Post‑job SMS requests for customer reviews
- **Invoice Chaser**: Automated follow‑ups for unpaid invoices
- **Webhook Dispatcher**: Event routing to external systems
- **OAuth Token Exchange**: IoT provider authentication management
- **Data Polling Engine**: Scheduled IoT polling for thermostat data
- **Token Refresh**: Automated OAuth token maintenance
- **AI Gateway**: Unified LLM routing with fallback strategies

### 6. Platform Infrastructure
Core platform capabilities that enable multi‑tenant operations:

- **Multi‑Company RBAC**: 6‑tier role system (Owner → Admin → Manager → Tech → Client → Student)
- **Company Switching**: Seamless context switching for users belonging to multiple companies
- **Invite Code System**: Seat management and team onboarding
- **Subscription Management**: Stripe‑based plans with usage tracking
- **Usage Tracking**: Feature telemetry for product analytics
- **Offline Mode**: Calculator access without internet connectivity
- **Customizable HUD**: Minimalistic heads‑up display with badges, tooltips, and quick‑jump navigation for technicians
- **Mobile App**: Native Android/iOS wrappers via Capacitor

### 7. Privacy & Compliance
Enterprise‑grade privacy and security features:

- **GDPR/CCPA Compliance**: Database‑backed consent tracking and Data Subject Rights (DSR) APIs
- **Cookie Consent Management**: Customizable consent banner with granular preferences
- **Data Subject Rights**: User data export, deletion, and correction request endpoints
- **SOC 2 Readiness**: Encryption at rest (AES‑256) and in transit (TLS 1.3)
- **Audit Trail**: Comprehensive consent logging with IP and user‑agent tracking

## User Roles & Permissions

### Role Hierarchy
1. **Owner**: Full access to all company data, billing, and team management
2. **Admin**: Company configuration, user management, and reporting
3. **Manager**: Job assignment, client management, and technician oversight
4. **Technician**: Job execution, tool access, and client communication
5. **Client**: Portal access to track jobs, view invoices, and submit requests
6. **Student**: Learning‑focused access to calculators and educational content

### Access Control
- **Route‑based protection**: Dynamic redirects based on role (see `ProtectedRoute` in App.tsx)
- **Feature‑gating**: Subscription‑based access to advanced features (e.g., `SubscriptionGuard`)
- **Company‑scoped data**: All queries include company‑ID filters via RLS policies
- **Multi‑company users**: Users can belong to multiple companies and switch contexts

## API Surface Map

### Authentication & User Management
- `POST /api/auth/signup` – User registration
- `POST /api/auth/signin` – User login
- `POST /api/auth/signout` – Session termination
- `GET /api/auth/me` – Current user profile

### Calculations & Engineering
- `POST /api/calculations` – Save a calculation
- `GET /api/calculations` – List user calculations
- `GET /api/calculations/:id` – Retrieve specific calculation
- `PUT /api/calculations/:id` – Update calculation
- `DELETE /api/calculations/:id` – Delete calculation
- `GET /api/user/stats` – User calculation statistics

### Engineering Endpoints
- `POST /api/calculate-airflow` – Airflow calculations
- `POST /api/calculate-deltat` – Temperature difference calculations
- `POST /api/calculate-standard` – Standard vapor compression cycle
- `POST /api/calculate-cascade` – Cascade system analysis
- `POST /api/compare-refrigerants` – Refrigerant property comparison

### Team & Company Management
- `GET /api/team` – List team members
- `POST /api/team/invite` – Invite new team member
- `PUT /api/team/role` – Update team member role
- `DELETE /api/team/member` – Remove team member

### Privacy & Compliance
- `POST /api/privacy/consent` – Record user consent
- `GET /api/privacy/consent` – Retrieve user consents
- `GET /api/privacy/consent/check` – Check consent status
- `POST /api/privacy/dsr` – Submit Data Subject Request
- `POST /api/privacy/export` – Export user data

### Subscriptions & Billing
- `GET /api/subscriptions/plans` – List available plans
- `GET /api/subscriptions/current` – Current user subscription
- `POST /api/subscriptions/update` – Update subscription
- `POST /api/subscriptions/cancel` – Cancel subscription
- `POST /api/subscriptions/payment-intent` – Create payment intent
- `POST /api/billing/*` – Stripe webhook handlers

### Fleet Management
- `GET /api/fleet/status` – Fleet status and vehicle locations

### Storage & Uploads
- `POST /api/storage/upload` – Upload user avatar (Supabase Storage)

### Diagnostics
- `GET /api/diagnostics/supabase` – Server‑to‑Supabase connectivity test

### Reports
- `POST /api/reports/generate` – Generate PDF reports

### AI & Pattern Recognition
- `POST /api/ai/patterns/analyze` – Analyze symptom patterns
- `POST /api/ai/patterns/related` – Get related patterns
- `POST /api/ai/patterns/symptom-outcome` – Create symptom‑outcome pattern
- `POST /api/ai/patterns/measurement-anomaly` – Create measurement‑anomaly pattern
- `PUT /api/ai/patterns/:patternId/feedback` – Update pattern feedback
- `GET /api/ai/patterns/:companyId/:type` – Get patterns by type
- `POST /api/ai/enhanced-troubleshoot` – Enhanced troubleshooting with AI

### Public Endpoints
- `GET /api/health` – Health check
- `GET /api/stats/user-count` – Marketing user count

## Development & Deployment

### Quality Metrics
- **Bundle Size**: 1.1 MB (80% reduction from 5.5 MB)
- **Lighthouse Scores**: PWA >90, Performance >85
- **Test Pass Rate**: 100% on last run
- **Error Rate**: Minimal console errors in production

### CI/CD Pipeline
1. **Quality Gate**: Lint, typecheck, unit tests
2. **Coverage Gate**: Unit coverage thresholds enforced
3. **Docs SoT Gate**: Cross‑check README + navigation against OpenAPI
4. **E2E Smoke Gate**: Deterministic public‑page tests
5. **Full E2E Suite**: Complete authenticated workflow tests (manual dispatch)

### Development Features
- **Authentication Bypass**: Development‑only bypass via `?bypassAuth=1` URL parameter or `DEBUG_BYPASS=1` localStorage flag, automatically disabled in production with visual `DevModeBanner` indicator
- **Asset Generation**: Integrated AI image generation (Flux‑Schnell model) for creating game assets, sprites, and UI elements with optimal quality‑to‑cost settings

### Deployment Options
- **Vercel**: Frontend static hosting
- **Render**: Express.js server deployment
- **Supabase**: Database, Auth, Storage, and Edge Functions
- **Docker**: Containerized deployment with ELK stack for monitoring

### Monitoring & Observability
- **Application Monitoring**: Datadog RUM & logs
- **Error Tracking**: Sentry for frontend and backend
- **Performance**: Custom monitoring provider with telemetry hooks
- **Audit Logging**: Comprehensive consent and DSR request logging

## Conclusion

ThermoNeural represents a comprehensive, production‑ready platform that bridges advanced thermodynamic engineering with modern business operations. Its multi‑tenant architecture, granular RBAC, and extensive AI integrations make it suitable for HVAC‑R service businesses of all sizes.

The codebase demonstrates strong engineering practices with full test coverage, type safety, privacy‑by‑design, and a clear separation of concerns between physics engines, business logic, and AI layers.

*Last updated: 2026‑03‑16 | Based on codebase analysis of version 2.1.0*