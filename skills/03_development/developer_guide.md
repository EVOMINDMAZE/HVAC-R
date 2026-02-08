---
name: Developer Guide & Onboarding 🚀
description: Complete developer guide and onboarding for ThermoNeural HVAC-R platform covering setup, architecture, workflows, testing, and deployment.
version: 2.0
---

# Developer Guide & Onboarding 🚀

## Quick Start (5-Minute Setup)

> **New to the project?** Follow these steps to get your development environment running in under 5 minutes.

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/hvacR.git
cd hvacR/HVAC-R
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials (get them from [Supabase Dashboard](https://app.supabase.com)).

### 4. Start Local Development

```bash
npm run dev
```

This starts:

- **Frontend**: `http://localhost:5173`
- **Supabase Studio**: `http://localhost:54323`
- **Database**: PostgreSQL on `localhost:54322`

### 5. Verify Installation

- Open `http://localhost:5173` in your browser
- You should see the ThermoNeural login screen
- Click "Login as Admin" using the default credentials

**Next Steps:** Read the detailed sections below for architecture, workflows, and best practices.

## Technology Stack

### Core Framework

- **Frontend**: React 18 + TypeScript + Vite
- **Build Tool**: Vite 5.2+ (TypeScript, SWC, Lightning CSS)
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: Zustand (global) + React Query (server state)
- **Routing**: React Router 6

### Backend Services

- **Database**: Supabase PostgreSQL 15
- **Authentication**: Supabase Auth (email/password, OAuth)
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Storage**: Supabase Storage (S3-compatible)
- **Realtime**: Supabase Realtime (PostgreSQL change capture)

### Third-Party Integrations

- **Stripe**: Payment processing
- **Resend**: Transactional email
- **Telnyx**: SMS notifications
- **xAI/Grok**: AI reasoning
- **DeepSeek**: Physics/AI validation
- **Groq**: Fast LLM fallback

## Project Structure

```
HVAC-R/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Route-level pages
│   │   ├── lib/              # Client-side utilities
│   │   └── types/            # TypeScript definitions
│   └── public/               # Static assets
├── supabase/                  # Supabase backend
│   ├── functions/            # Edge Functions (Deno)
│   │   ├── ai-gateway/       # Multi-model AI routing
│   │   ├── billing/          # Stripe payment processing
│   │   └── _shared/          # Shared Edge Function code
│   ├── migrations/           # Database schema migrations
│   ├── seed.sql              # Initial database seed data
│   └── config.toml           # Supabase CLI configuration
├── skills/                   # Documentation & processes
│   ├── 00_meta/             # Templates & metadata
│   ├── 01_strategy/         # Business strategy & planning
│   ├── 02_business/         # Business logic & pricing
│   ├── 03_development/      # Development guides (this file)
│   ├── 04_ai/               # AI agents & protocols
│   ├── 05_domain/           # HVAC-R domain knowledge
│   └── 06_automations/      # Automation scripts & tools
├── docs/                    # Project documentation
├── scripts/                 # Build & deployment scripts
└── .github/                 # GitHub Actions workflows
```

## Getting Started

### Prerequisites

- **Node.js 18+** (recommended: 20+)
- **npm 9+** or **yarn 1.22+**
- **Git** for version control
- **Supabase CLI** (for local development)

### Environment Setup

#### 1. Supabase Setup

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Start local Supabase (requires Docker)
supabase start
```

#### 2. Environment Variables

Create `.env` file in project root:

```bash
cp .env.example .env
```

**Required variables:**

```
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Providers (optional for local dev)
XAI_API_KEY=...
DEEPSEEK_API_KEY=...
GROQ_API_KEY=...

# Email/SMS (optional for local dev)
RESEND_API_KEY=...
TELNYX_API_KEY=...
TELNYX_FROM_NUMBER=...
```

### 3. Database Setup

```bash
# Apply migrations to local database
supabase db push

# Seed with sample data (optional)
supabase db reset --seed
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Servers

```bash
# Frontend + local Supabase
npm run dev

# Frontend only (if Supabase already running)
npm run dev:client
```

## Development Workflow

### Branch Strategy

- `main` – Production-ready code
- `develop` – Integration branch
- `feature/*` – New features
- `fix/*` – Bug fixes
- `docs/*` – Documentation changes

### Pull Request Process

1. **Create Feature Branch**: `git checkout -b feature/my-feature`
2. **Make Changes**: Follow coding standards
3. **Run Tests**: `npm run test`
4. **Type Check**: `npm run typecheck`
5. **Commit**: Use conventional commits
6. **Push**: `git push origin feature/my-feature`
7. **Create PR**: With detailed description
8. **Review**: Address feedback
9. **Merge**: Squash commits

### Coding Standards

#### TypeScript

- Use strict mode (`strict: true` in `tsconfig.json`)
- Avoid `any` type; use `unknown` or proper interfaces
- Use ESLint with TypeScript rules

#### React Components

- Use functional components with hooks
- Export props interface with component
- Use `React.memo` for expensive renders
- Follow the component naming pattern: `PascalCase`

#### CSS/Styling

- Use Tailwind CSS for utility-first styling
- Extract repeated patterns to CSS Modules
- Follow BEM naming for complex components

#### State Management

- **Local State**: `useState`, `useReducer`
- **Global State**: Zustand stores
- **Server State**: React Query (TanStack Query)
- **Form State**: React Hook Form

## Testing

### Test Suite

```bash
# Run all tests
npm run test

# Run specific test
npm run test -- --testNamePattern="Login"

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Testing Strategy

- **Unit Tests**: Jest + Testing Library
- **Integration Tests**: Playwright (E2E)
- **API Tests**: Supertest for Edge Functions
- **Visual Regression**: Percy (optional)

### Test Coverage Requirements

- **Minimum**: 80% line coverage
- **Critical Paths**: 95%+ (auth, billing, AI)
- **New Features**: Must include tests

## Deployment

### Overview

ThermoNeural uses a multi-service deployment strategy:

- **Frontend**: Netlify
- **Backend**: Supabase Cloud
- **Calculations**: Render (Python/FastAPI)

### Automated Deployment

```bash
# Full deployment (recommended)
./scripts/deploy-all.sh

# Individual components
./scripts/deploy-supabase.sh
./scripts/deploy-frontend.sh
```

### CI/CD Pipeline

- **GitHub Actions**: `.github/workflows/deploy.yml`
- **Automated Tests**: Run on every PR
- **Preview Deployments**: Netlify preview URLs
- **Production Deployments**: Auto-deploy on `main`

### Manual Deployment

See the [Comprehensive Deployment Guide](./deployment.md) for detailed manual deployment steps.

## Troubleshooting

### Common Issues

#### "Supabase is not configured"

- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check that Supabase CLI is running locally
- Verify network connectivity

#### "TypeScript errors after update"

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Run type check
npm run typecheck
```

#### "Database migration failed"

```bash
# Check migration status
supabase db diff

# Reset and retry (CAUTION: destroys local data)
supabase db reset
```

#### "Edge Function deployment failed"

```bash
# Check function logs
supabase functions logs <function-name>

# Deploy with verbose output
supabase functions deploy <name> --debug
```

### Performance Issues

- **Slow Builds**: Check Vite configuration, consider caching
- **Memory Leaks**: Profile with Chrome DevTools
- **Database Queries**: Use Supabase Dashboard → Query Performance

## Best Practices

### Code Quality

- **TypeScript**: Enable strict mode, avoid `any`
- **Testing**: Write tests for new features
- **Documentation**: Update README and inline comments
- **Code Review**: Request reviews for significant changes

### Performance

- **Bundle Size**: Use code splitting, tree shaking
- **Images**: Optimize with `vite-imagetools`
- **API Calls**: Implement caching with React Query
- **Database**: Use indexes, avoid N+1 queries

### Security

- **Environment Variables**: Never commit secrets
- **Authentication**: Use Supabase Auth, implement RLS
- **API Keys**: Rotate regularly, use least privilege
- **Dependencies**: Update regularly, audit for vulnerabilities

## Resources

### Documentation

- [Skills Directory](../README.md) – All documentation and processes
- [Comprehensive Deployment Guide](./deployment.md) – Deployment guide
- [AI Agents & Protocols](../04_ai/agents.md) – AI standards
- [Pricing Model](../02_business/pricing_model.md) – Business model

### External Links

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Support

- **GitHub Issues**: Bug reports and feature requests
- **Discord/Slack**: Team communication
- **Weekly Standups**: Development sync
- **Code Reviews**: Peer feedback

---

*This guide merges content from the original Developer Guide and Developer Onboarding documentation. For questions or suggestions, create an issue in the GitHub repository.*
