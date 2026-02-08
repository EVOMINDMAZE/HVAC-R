# Developer Onboarding Guide

Welcome to the ThermoNeural HVAC-R development team! This guide will get you up and running in under 30 minutes.

## Prerequisites

- **Node.js**: v18.17.0 or higher (we recommend using nvm)
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Code Editor**: VS Code recommended with extensions listed below

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
git clone <repository-url>
cd HVAC-R
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required: Supabase credentials, Stripe keys (for payments)
# Optional: AI provider keys, IoT integration keys
```

### 3. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:client  # Frontend only (Vite)
npm run dev:server  # Backend only (Express)
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:5173/docs/api/portal/

## Project Structure

```
HVAC-R/
├── client/                 # React frontend
│   ├── components/         # React components
│   │   ├── calculators/    # Physics calculation UIs
│   │   ├── invoices/       # Billing components
│   │   └── ai/             # AI diagnostic components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   └── styles/             # Global styles
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic
│   └── middleware/         # Express middleware
├── supabase/               # Supabase configuration
│   ├── functions/          # Edge functions (Deno)
│   ├── migrations/         # Database migrations
│   └── policies/           # RLS policies
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   └── architecture/       # C4 diagrams
├── android/ & ios/         # Capacitor mobile apps
└── e2e/                    # Playwright tests
```

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Production fixes

### Making Changes

1. **Create a branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Edit code following our conventions
3. **Run tests**: `npm test` (unit) and `npm run test:e2e` (e2e)
4. **Lint code**: `npm run lint`
5. **Type check**: `npm run typecheck`
6. **Commit**: Follow conventional commits (see below)
7. **Push and PR**: Create pull request to `develop`

### Code Conventions

#### TypeScript

- Enable strict mode
- No `any` types without justification
- Use interfaces for object shapes
- Document public functions with JSDoc

```typescript
/**
 * Calculate superheat for a refrigeration system
 * @param suctionPressure - Suction pressure in PSIG
 * @param suctionTemp - Suction line temperature in °F
 * @param refrigerant - Refrigerant type (e.g., "R410A")
 * @returns Superheat value in °F
 */
function calculateSuperheat(
  suctionPressure: number,
  suctionTemp: number,
  refrigerant: string
): number {
  // Implementation
}
```

#### React Components

- Use functional components with hooks
- Props interfaces must be defined
- Use React.memo for expensive renders
- Custom hooks for reusable logic

```typescript
interface CalculatorProps {
  refrigerant: string;
  onCalculate: (result: CalculationResult) => void;
}

export const Calculator: React.FC<CalculatorProps> = React.memo(({
  refrigerant,
  onCalculate
}) => {
  // Component logic
});
```

#### Git Commits

Follow conventional commits:

```
feat: add psychrometric calculator
fix: resolve RLS policy recursion
docs: update API documentation
refactor: simplify calculation hooks
test: add unit tests for A2L calculator
chore: update dependencies
```

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- calculators/a2l.test.ts

# Watch mode
npm run test:watch
```

### E2E Tests (Playwright)

```bash
# Run all e2e tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npm run test:e2e -- jobs.spec.ts

# Debug mode
npm run test:e2e:debug
```

### Test Coverage Requirements

- Unit tests: ≥65% coverage
- Critical paths: 100% coverage
- All new features must include tests

## Key Technologies

### Frontend

- **React 18**: UI framework with concurrent features
- **TypeScript**: Type safety
- **Vite**: Build tool with HMR
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Component library
- **React Router 6**: Routing
- **Framer Motion**: Animations

### Backend

- **Express.js**: API server
- **Supabase**: PostgreSQL, Auth, Storage
- **Deno**: Edge functions runtime
- **Stripe**: Payments

### Testing

- **Vitest**: Unit testing
- **Playwright**: E2E testing
- **React Testing Library**: Component testing

### DevOps

- **GitHub Actions**: CI/CD
- **Docker**: Containerization
- **Capacitor**: Mobile builds

## Common Tasks

### Adding a New API Endpoint

1. Define route in `server/routes/`
2. Add OpenAPI documentation in `docs/api/openapi.yaml`
3. Create tests in `server/routes/__tests__/`
4. Update API client hooks in `client/hooks/`

### Adding a Database Migration

```bash
# Create migration
supabase migration new migration_name

# Apply locally
supabase db reset

# Generate types
supabase gen types typescript --local > client/lib/database.types.ts
```

### Adding an Edge Function

```bash
# Create function
supabase functions new function-name

# Deploy
supabase functions deploy function-name

# Test locally
supabase functions serve function-name
```

### Working with RLS Policies

Always test RLS policies with different user roles:

```sql
-- Test as specific role
SET LOCAL ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-uuid", "role": "technician"}';

-- Test query
SELECT * FROM jobs WHERE company_id = 'company-uuid';
```

## Debugging

### Frontend

- Use React DevTools browser extension
- Enable Redux DevTools for state inspection
- Use Vite's built-in error overlay
- Check browser console for warnings

### Backend

- Use VS Code debugger with `launch.json`
- Add `console.log` for quick debugging
- Use `debug` npm package for structured logging
- Check Supabase logs in dashboard

### Edge Functions

```bash
# Local development with logs
supabase functions serve --debug

# View logs
supabase functions logs function-name
```

## Resources

### Documentation

- [API Documentation](./api/portal/index.html): Interactive API reference
- [Architecture Diagrams](./architecture/): C4 model diagrams
- [Testing Guide](../TESTING_GUIDE.md): Testing strategies

### External Resources

- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)

### Getting Help

1. Check this guide and other documentation
2. Search existing issues and PRs
3. Ask in #dev-help Slack channel
4. Schedule pairing session with team member

## VS Code Extensions

Recommended extensions for optimal development:

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript Importer**: Auto-imports
- **Tailwind CSS IntelliSense**: Class completion
- **Vitest**: Test runner integration
- **Playwright Test**: E2E test integration
- **PlantUML**: Diagram preview
- **YAML**: OpenAPI spec editing

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook secret |
| `RESEND_API_KEY` | For emails | Resend API key |
| `TELNYX_API_KEY` | For SMS | Telnyx API key |
| `GROK_API_KEY` | For AI | Grok API key |
| `DEEPSEEK_API_KEY` | For AI | DeepSeek API key |

## Next Steps

1. ✅ Complete this onboarding
2. 📚 Review [Architecture Decision Records](../ARCHITECTURE_DECISION_RECORDS.md)
3. 🔍 Explore the codebase with a small bug fix
4. 🧪 Write your first test
5. 🚀 Deploy your first change

Welcome to the team! 🎉

---

**Questions?** Reach out to the team in #dev-help or schedule a 1:1 with your onboarding buddy.