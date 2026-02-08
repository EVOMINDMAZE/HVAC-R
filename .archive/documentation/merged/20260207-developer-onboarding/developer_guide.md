---
name: Developer Guide
description: Welcome to the ThermoNeural (HVAC-R) developer documentation. This guide provides comprehensive information on the project's architecture, setup, t...
version: 1.0
---

# Developer Guide

Welcome to the **ThermoNeural (HVAC-R)** developer documentation. This guide provides comprehensive information on the project's architecture, setup, technology stack, and development workflows.

## 1. Technology Stack

### Frontend
- **Framework:** [React](https://react.dev/) (v18)
- **Build Tool:** [Vite](https://vitejs.dev/) (Optimized with Lazy Loading)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Architecture:** Route-based code splitting (80% bundle reduction)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) (Headless), [Shadcn UI](https://ui.shadcn.com/) implementation patterns
    - **Standards:** Dropdowns and popovers utilize the "Office" theme (`bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl`) with neutral slate highlights.
- **State Management:** React Context + Hooks (`useSupabaseAuth`, `useToast`, etc.)
- **Routing:** `react-router-dom` (Standardized under `/dashboard/*`)
- **SEO:** `react-helmet-async` with generic `<SEO />` component
- **Charts:** `recharts` (Responsive with `ResponsiveContainer`)
- **PDF Generation:** `pdf-lib` (Client-side report generation)
- **Animations:** `framer-motion`
- **3D Rendering:** `three.js` with `@react-three/fiber`

### Backend / Server
- **Runtime:** Node.js
- **Framework:** Express.js
- **API Communication:** REST
- **Database (Auth/Data):** [Supabase](https://supabase.com/) (PostgreSQL)
- **Payments:** [Stripe](https://stripe.com/)
- **Heavy Compute:** Render (Python/Go)
- **Automations:** Supabase Edge Functions (Deno Runtime) - e.g., `invite-user`, `ai-troubleshoot`

## 2. Architecture Overview

The project is structured as a monorepo-style codebase containing both client and server source code.

- **`/client`**: Contains the React frontend application.
  - `pages/`: Application views/routes.
  - `components/`: Reusable UI components (e.g., `invoices/`, `ui/`, `auth/`).
  - `hooks/`: Custom React hooks (e.g., `useSupabaseAuth`).
  - `lib/`: Utility libraries and API clients (`api.ts`, `supabase.ts`).
- **`/server`**: Contains the Node.js/Express backend.
  - `routes/`: API route definitions (Stripe webhooks, Auth, Calculations proxy).
  - `services/`: Business logic.
- **`/shared`**: Shared types and utilities between client and server.
- **`/supabase`**: Supabase configuration, migrations, and Edge Functions.

## 3. Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)
- Docker (for local Supabase development)
- A Supabase project (for Authentication & Database in production)
- A Stripe account (for Subscription management)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd HVAC-R
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

You must populate the following keys for the application to function correctly:

- **Supabase:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Stripe:** `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Stripe Price IDs:** Set these to correspond with your Stripe Product Catalog.

### Running the Application

To start the development environment (Client + Server):

1. **Start Local Supabase (Docker):**
   ```bash
   supabase start
   ```

2. **Start the Application:**
   ```bash
   npm run dev
   ```
   This will start Vite (usually on port 5173 or 8080) and the backend server.

3. **Configure Environment:**
   Ensure your `.env` file has `VITE_SUPABASE_URL=http://localhost:54321` for local development.

## 4. Key Workflows

### Authentication
Authentication is handled via Supabase Auth. The frontend uses `useSupabaseAuth` hook to manage user sessions.
- **Login:** Users can sign in with Email/Password or Google OAuth.
- **Session Persistence:** Tokens are stored in `localStorage` by the Supabase client to survive PWA reloads.
- **Protected Routes:** `ProtectedRoute` component ensures only authenticated users access secured pages.
- **RBAC:**
  - **Admin**: Full access to Dashboard, Jobs, Teams, and Company settings.
  - **Manager**: View/Manage all jobs and team members within their specific company.
  - **Tech / Technician**: View assigned jobs, update status, and perform calculations.
  - **Student**: Access to calculators and learning materials (Web Stories).
  - **Client**: Restricted to `/portal`, `/history`, and `/track-job`. Attempts to access unrestricted routes are automatically redirected.

### Calculations
### Calculations
Calculations (e.g., Standard Cycle, Cascade Cycle) employ a **Hybrid Architecture**:
- **Client-Side:** Input validation, basic unit conversion, and UI state management.
- **Server-Side:** Heavy thermodynamic properties (via CoolProp) are calculated in a **Python/FastAPI Service** hosted on **Render**.
    - This service ensures accurate thermodynamic modeling (e.g., standard cycle, cascade).
- **AI Logic**: All AI features follow the **AI Gateway Pattern**.
    - **Gateway**: `supabase/functions/ai-gateway` acts as the central router for all LLM requests.
    - **Routing Modes**:
        - `fast-reasoning`: Grok-2 (`grok-2-1212`) for complex logic and reasoning.
        - `vision`: Grok-2 Vision (`grok-2-vision-1212`) for media analysis.
        - `physics`: DeepSeek (`deepseek-reasoner`) for thermodynamic and technical validation.
        - `general`: Groq (`llama-3.3-70b-versatile`) for fast chat and UI text.
    - **Dual Persona**: Supports "Homeowner" (safety first) and "Technician" (technical data) personas via context injection in the calling functions.
- **API Client:** `client/lib/api.ts` handles all external requests. It automatically injects the Supabase Access Token into the `Authorization` header for secure endpoints.

### Subscription & Payments
Stripe integration manages user subscriptions (Professional/Enterprise tiers).
- **Webhooks:** The server listens for Stripe webhooks to update user subscription status.
- **Provisioning**: The `stripe-webhook` Edge Function automatically provisions new `companies` and `licenses` upon successful checkout.
- **Pricing Page:** dynamic pricing tables based on configured Stripe Price IDs.

### Realtime Features
The application utilizes Supabase Realtime for live updates across the platform:
- **Technician Tracking**: Job locations and status updates are broadcast via the `jobs` and `technician_locations` tables.
- **Job Board**: New jobs and assignments appear instantly on the Admin Dispatch board without page refreshes.
- **Status Sync**: In-app notifications and task progress bars utilize Realtime broadcast channels for sub-second latency.

### Deployment & Database Management

This project uses **Docker for local development** and **Supabase Cloud for production**.

#### Local Development with Docker
- **Start Local Supabase:** `supabase start` (uses Docker containers for database, auth, storage)
- **Local Environment:** Configure `.env` with `VITE_SUPABASE_URL=http://localhost:54321`
- **Local Development:** Test changes locally with Docker containers

#### Cloud Production Deployment
- **Migrations:** Use `supabase db push` to apply migrations to the linked remote project.
- **Production Environment:** Uses cloud Supabase instance exclusively.
- **Workflow:** Develop locally with Docker → Test → Push to cloud with `supabase db push`

### Build
To build both the client and server for production:

```bash
npm run build
```

The output will be generated in the `dist/` directory.

## 6. Development Standards

- **Formatting:** Prettier is used for code formatting. Run `npm run format.fix` to format code.
- **Linting:** Standard ESLint configuration.
- **Testing:**
  - Unit Tests: `npm run test` (Vitest)
  - E2E Tests: `npm run test:e2e` (Playwright)

## 7. Troubleshooting

- **Authentication Errors:** Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct. Check browser console for CORS errors.
- **Stripe Issues:** Verify Webhook Secret matches the local listener if testing webhooks locally (use `stripe listen`).

## 8. Workspace Maintenance

To keep the repository clean and efficient:
- **No Log Persistence**: Do NOT commit `.log` files to the repository. Ensure `test-results/` is gitignored.
- **Console Hygiene**: Remove all debugging `console.log` statements before merging features.
- **Artifacts**: Use the internal brain documentation for decision tracking, keeping the root directory focused purely on source code and configuration.

## 9. Testing Standards

- **Static Analysis First**: To optimize for efficiency and token usage, prioritize static code analysis and reading code files over running the full test suite repeatedly.
- **Targeted Execution**: Run specific tests using the `-g` flag (e.g., `npx playwright test -g "test name"`) to debug isolated issues.
- **Reporter Configuration**: Use `--reporter=list` (e.g., `npx playwright test --reporter=list`) when debugging to reduce verbose output and token consumption.
- **Headless First**: E2E tests are configured to run headlessly by default for speed and CI compatibility.
- **Self-Healing Data**: Tests should not rely on pre-existing data. Use setup hooks (`test.beforeAll`) to verify and create necessary records (Users, Clients) if they are missing.
- **Visual Debugging**: If a test fails, check the `test-results/` directory for trace files and screenshots.
- **Command**: Run `npm run test:e2e` to execute the full suite.

---
*Created by [Your Name/Team] - Last Updated: January 2026*
