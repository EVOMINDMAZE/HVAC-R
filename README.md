# ThermoNeural (HVAC-R)

**ThermoNeural** is a state-of-the-art Progressive Web Application (PWA) designed for HVAC&R professionals, engineers, and students. It provides advanced tools for cycle analysis, refrigerant comparison, system troubleshooting, and professional estimation.

## 🚀 Quick Start

For detailed setup instructions, please refer to the [Developer Guide](./skills/03_development/developer_guide.md).

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    Copy `.env.example` to `.env` and fill in your Supabase and Stripe keys.
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## ✨ Features

### Physics Engine (Calculators)
- **Standard Vapor Compression Cycle** - Real-time thermodynamic calculations
- **Cascade System Analyzer** - Ultra-low temperature specialty systems
- **Psychrometric Calculator** - Indoor air quality scoring
- **A2L/A3 Safety Calculator** - 80+ refrigerants database
- **Target Superheat (Fixed Orifice)** - Auto-weather integration
- **Refrigerant Comparison** - Side-by-side analysis
- **Air Density Calculator** - PDF report generation
- **Subcooling Calculator** - System optimization

### Business Operations Engine
- **Job System & Context** - Central work unit management
- **EPA 608 Compliance** - Audit-proof refrigerant logging
- **Warranty Auto-Pilot** - OCR + AI extraction
- **Indoor Health Reports** - Professional PDF generation
- **Invoice Management** - One-click generation
- **Client Portal** - Job tracking and status
- **Technician Dispatch** - Real-time mapping
- **Fleet Management** - Vehicle tracking

### AI & Customer Experience Layer
- **Pre-Dispatch Triage** - Public homeowner portal
- **AI Diagnostics Assistant** - LLM-driven troubleshooting
- **Web Stories Content** - TikTok-style guides
- **Pattern Recognition** - Symptom-outcome learning
- **Weather Intelligence** - Proactive sales alerts
- **Technician Feedback** - Skill development

### Automation & Integration Layer
- **Review Hunter** - Post-job SMS requests
- **Invoice Chaser** - Automated follow-ups
- **Webhook Dispatcher** - Event routing
- **OAuth Token Exchange** - IoT provider auth
- **Data Polling Engine** - Scheduled IoT polling
- **Token Refresh** - OAuth maintenance
- **AI Gateway** - Unified LLM routing

### Platform Infrastructure
- **Multi-Company RBAC** - 6-tier role system (Owner → Admin → Manager → Tech → Client → Student)
- **Company Switching** - Context switching for multi-company users
- **Invite Code System** - Seat management
- **Subscription Management** - Stripe integration
- **Usage Tracking** - Feature telemetry
- **Offline Mode** - Calculator access without internet
- **Mobile App** - Native Android/iOS wrappers

### Privacy & Compliance
- **GDPR/CCPA Compliance** - Database-backed consent tracking and Data Subject Rights (DSR) APIs
- **Cookie Consent Management** - Customizable consent banner with granular preferences
- **Data Subject Rights** - User data export, deletion, and correction request endpoints
- **SOC 2 Readiness** - Encryption at rest (AES-256) and in transit (TLS 1.3)
- **Audit Trail** - Comprehensive consent logging with IP and user agent tracking

## 📚 Documentation

- [**Developer Guide**](./skills/03_development/developer_guide.md): Architecture, Tech Stack, and detailed setup.
- [**Developer Guide & Onboarding**](./skills/03_development/developer_guide.md): Complete guide with quick start, architecture, and workflows
- [**API Documentation**](./docs/api/portal/index.html): Interactive API reference with 27 endpoints
- [**Architecture Diagrams**](./docs/architecture/): C4 model diagrams (System Context, Container, Component) with GDPR/CCPA privacy compliance components
- [**Deployment**](./skills/03_development/developer_guide.md#deployment--database-management): How to build and deploy.
- [**AI Context**](./AI_ONBOARDING.md): **Start Here** for AI Agents and New Contributors.
- [Documentation Navigation Map](./docs/documentation-navigation.md)

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript (strict mode)
- **Vite 6.2.2** - Ultra-fast HMR
- **Tailwind CSS 3.4** + **Shadcn UI** (Radix Primitives)
- **React Router DOM 6.26**
- **Framer Motion 12.6** for animations
- **Vite PWA Plugin** - Offline calculator access
- **Capacitor 8.0** - Android/iOS wrapper

### Backend
- **Supabase** - PostgreSQL 17, Auth, Storage, Edge Functions
- **Express.js** - Legacy API routes, engineering calculations
- **Deno** - Edge functions runtime (15+ functions)

### AI/ML
- **AI Gateway** - Unified edge function for LLM routing
- **Grok-2-Vision** - Image analysis
- **DeepSeek LLM** - Technical troubleshooting
- **Pattern Recognition** - Custom service for symptom-outcome correlation

### External Integrations
- **Stripe** - Payments & subscriptions
- **Resend** - Transactional email
- **Telnyx** - SMS notifications
- **Open-Meteo** - Weather data
- **Sanity.io** - Content management
- **Google Sheets** - Data import/export
- **Honeywell/Resideo** - IoT thermostat data
- **Google Nest** - Smart home integration

## 🧪 Testing

- **Unit Tests**: 65+ passing tests (Vitest)
- **E2E Tests**: 40+ comprehensive scenarios (Playwright)
- **Coverage**: 65%+ code coverage

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e

# Run e2e with UI
npm run test:e2e:ui
```

## 📊 Quality Metrics

- **Bundle Size**: 1.1MB (80% reduction from 5.5MB)
- **Lighthouse Scores**: PWA >90, Performance >85
- **Test Pass Rate**: 100% on last run
- **Error Rate**: Minimal console errors in production

## 🤝 Contributing

Please ensure you run `npm run format.fix` before committing changes to maintain code style consistency.

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with proper JSDoc comments
3. Run tests: `npm test && npm run test:e2e`
4. Check types: `npm run typecheck`
5. Format code: `npm run format.fix`
6. Commit with conventional commits: `git commit -m "feat: add new calculator"`
7. Push and create a pull request

## 🔒 Privacy Compliance Deployment Checklist

Before deploying to production, ensure the following privacy compliance features are properly configured:

### 1. Database Migrations
- Run the consolidated baseline migration: `supabase db push`
- Verify `user_consents` table exists with proper RLS policies
- Confirm consent recording RPC functions are created

### 2. Environment Variables
- Set `NODE_ENV=production` to disable development authentication bypass
- Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Ensure `ENCRYPTION_KEY` is set for any application-level encryption

### 3. API Endpoints
- Test `/api/privacy/consent` endpoint with authenticated requests
- Verify `/api/privacy/dsr` endpoints respond correctly to data subject requests
- Confirm `/api/privacy/export` endpoint queues data export requests

### 4. Frontend Components
- Verify `ConsentBanner` appears on first visit and respects user preferences
- Test Privacy Policy page (`/privacy`) loads with DSR request forms
- Confirm consent synchronization between localStorage and backend

### 5. Audit & Monitoring
- Enable logging for all consent and DSR API calls
- Set up alerts for failed consent recording attempts
- Monitor data export request queue processing times

### 6. Legal Requirements
- Update privacy policy with company contact information
- Configure DSR request email notifications to legal/compliance team
- Document data retention policies and deletion procedures

### 7. Testing
- Run penetration tests targeting privacy endpoints
- Verify RBAC prevents unauthorized access to consent data
- Test data export functionality with real user data samples

## 📄 License

Proprietary software. All rights reserved.

## 📞 Support

For support, contact api-support@thermoneural.com or visit our developer portal.

---

*Last updated: 2026-02-07 | Version: 2.0.0 Production Ready*
