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
- **State Management:** React Context + Hooks (`useSupabaseAuth`, `useToast`, etc.)
- **Routing:** `react-router-dom`
- **Charts:** `recharts`
- **Animations:** `framer-motion`
- **3D Rendering:** `three.js` with `@react-three/fiber`

### Backend / Server
- **Runtime:** Node.js
- **Framework:** Express.js
- **API Communication:** REST
- **Database (Auth/Data):** [Supabase](https://supabase.com/) (PostgreSQL)
- **Payments:** [Stripe](https://stripe.com/)
- **Heavy Compute:** Render (Python/Go)
- **Automation Node:** Vultr (Docker/n8n)

## 2. Architecture Overview

The project is structured as a monorepo-style codebase containing both client and server source code.

- **`/client`**: Contains the React frontend application.
  - `pages/`: Application views/routes.
  - `components/`: Reusable UI components.
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
- A Supabase project (for Authentication & Database)
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

```bash
npm run dev
```
This will start Vite (usually on port 5173 or 8080) and the backend server.

## 4. Key Workflows

### Authentication
Authentication is handled via Supabase Auth. The frontend uses `useSupabaseAuth` hook to manage user sessions.
- **Login:** Users can sign in with Email/Password or Google OAuth.
- **Session Persistence:** Tokens are stored in `localStorage` by the Supabase client to survive PWA reloads.
- **Protected Routes:** `ProtectedRoute` component ensures only authenticated users access secured pages.

### Calculations
Calculations (e.g., Standard Cycle, Cascade Cycle) are performed either client-side or mocked via the backend API (`api.ts`).
- **API Client:** `client/lib/api.ts` handles all external requests. It automatically injects the Supabase Access Token into the `Authorization` header for secure endpoints.

### Subscription & Payments
Stripe integration manages user subscriptions (Professional/Enterprise tiers).
- **Webhooks:** The server listens for Stripe webhooks to update user subscription status in the database.
- **Pricing Page:** dynamic pricing tables based on configured Stripe Price IDs.

### Deployment & Database Management
**IMPORTANT: NO DOCKER USAGE**
This project uses **Supabase Cloud** exclusively. Do NOT use local Docker containers for the database or Supabase services.
- **Migrations:** Use `supabase db push` to apply migrations to the linked remote project.
- **Local Dev:** Connects directly to the cloud instance via `.env` credentials.

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

- **Headless First**: E2E tests are configured to run headlessly by default for speed and CI compatibility.
- **Self-Healing Data**: Tests should not rely on pre-existing data. Use setup hooks (`test.beforeAll`) to verify and create necessary records (Users, Clients) if they are missing.
- **Visual Debugging**: If a test fails, check the `test-results/` directory for trace files and screenshots.
- **Command**: Run `npm run test:e2e` to execute the full suite.

---
*Created by [Your Name/Team] - Last Updated: January 2026*
