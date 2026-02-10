import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { SupabaseAuthProvider, useAuth } from "@/hooks/useSupabaseAuth";
import { ToastProvider, useToast } from "@/hooks/useToast";
import { ThemeProvider } from "@/components/theme-provider";
import { DevModeBanner } from "@/components/DevModeBanner";
import "@/utils/authErrorHandler"; // Import to setup global error handling
import { JobProvider } from "@/context/JobContext";
// Critical path - keep static
import { Landing } from "@/pages/Landing";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import NotFound from "@/pages/NotFound";

// Lazy-loaded route components for code-splitting
const A2LLandingPage = lazy(() =>
  import("@/pages/A2LLandingPage").then((m) => ({ default: m.A2LLandingPage })),
);
const Features = lazy(() =>
  import("@/pages/Features").then((m) => ({ default: m.Features })),
);
const Pricing = lazy(() => import("@/pages/Pricing"));
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Profile = lazy(() =>
  import("@/pages/Profile").then((m) => ({ default: m.Profile })),
);
const History = lazy(() =>
  import("@/pages/History").then((m) => ({ default: m.History })),
);
const AdvancedReporting = lazy(() => import("@/pages/AdvancedReporting"));
const Troubleshooting = lazy(() => import("@/pages/Troubleshooting"));
const DIYCalculators = lazy(() => import("@/pages/DIYCalculators"));
const EstimateBuilder = lazy(() => import("@/pages/EstimateBuilder"));
const JobDetails = lazy(() => import("@/pages/JobDetails"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const CompanySettings = lazy(() => import("@/pages/CompanySettings"));
const Team = lazy(() => import("@/pages/settings/Team"));
const Projects = lazy(() => import("@/pages/Projects"));
const ClientDetail = lazy(() =>
  import("@/pages/ClientDetail").then((m) => ({ default: m.ClientDetail })),
);
const Clients = lazy(() =>
  import("@/pages/Clients").then((m) => ({ default: m.Clients })),
);
const ClientDashboard = lazy(() =>
  import("@/pages/ClientDashboard").then((m) => ({
    default: m.ClientDashboard,
  })),
);
const ClientTrackJob = lazy(() => import("@/pages/ClientTrackJob"));
const Dispatch = lazy(() => import("@/pages/dashboard/Dispatch"));
const TriageDashboard = lazy(() => import("@/pages/dashboard/TriageDashboard"));
const ActiveJob = lazy(() => import("@/pages/tech/ActiveJob"));
// const JobBoard = lazy(() => import("@/pages/tech/JobBoard"));
import JobBoard from "@/pages/tech/JobBoard"; // Direct import for debugging
const FleetDashboard = lazy(() => import("@/pages/dashboard/FleetDashboard"));
const Career = lazy(() => import("@/pages/Career"));
const StandardCycle = lazy(() =>
  import("@/pages/StandardCycle").then((m) => ({ default: m.StandardCycle })),
);
const RefrigerantComparison = lazy(() =>
  import("@/pages/RefrigerantComparison").then((m) => ({
    default: m.RefrigerantComparison,
  })),
);
const CascadeCycle = lazy(() =>
  import("@/pages/CascadeCycle").then((m) => ({ default: m.CascadeCycle })),
);
const RefrigerantInventory = lazy(
  () => import("@/pages/refrigerant/Inventory"),
);
const ComplianceReport = lazy(
  () => import("@/pages/refrigerant/ComplianceReport"),
);
const LeakRateCalculator = lazy(
  () => import("@/pages/refrigerant/LeakRateCalculator"),
);
const WarrantyScanner = lazy(() => import("@/pages/warranty/WarrantyScanner"));
const Triage = lazy(() => import("@/pages/public/Triage"));
const IAQWizard = lazy(() => import("@/pages/iaq/IAQWizard"));
const About = lazy(() =>
  import("@/pages/About").then((m) => ({ default: m.About })),
);
const Blog = lazy(() =>
  import("@/pages/Blog").then((m) => ({ default: m.Blog })),
);
const BlogPost = lazy(() =>
  import("@/pages/BlogPost").then((m) => ({ default: m.BlogPost })),
);
const Contact = lazy(() =>
  import("@/pages/Contact").then((m) => ({ default: m.Contact })),
);
const Documentation = lazy(() =>
  import("@/pages/Documentation").then((m) => ({ default: m.Documentation })),
);
const HelpCenter = lazy(() =>
  import("@/pages/HelpCenter").then((m) => ({ default: m.HelpCenter })),
);
const StripeDebug = lazy(() =>
  import("@/pages/StripeDebug").then((m) => ({ default: m.StripeDebug })),
);
const Privacy = lazy(() =>
  import("@/pages/Privacy").then((m) => ({ default: m.Privacy })),
);
const TermsOfService = lazy(() =>
  import("@/pages/TermsOfService").then((m) => ({ default: m.TermsOfService })),
);
const WebStories = lazy(() =>
  import("@/pages/WebStories").then((m) => ({ default: m.WebStories })),
);
const Podcasts = lazy(() =>
  import("@/pages/Podcasts").then((m) => ({ default: m.Podcasts })),
);
const IntegrationLanding = lazy(() =>
  import("@/pages/IntegrationLanding").then((m) => ({
    default: m.IntegrationLanding,
  })),
);
const Callback = lazy(() =>
  import("@/pages/Callback").then((m) => ({ default: m.Callback })),
);
const AgentSandbox = lazy(() => import("@/pages/AgentSandbox"));
const PatternInsights = lazy(() =>
  import("@/pages/ai/PatternInsights").then((m) => ({
    default: m.PatternInsights,
  })),
);
const SelectCompany = lazy(() => import("@/pages/SelectCompany"));
const InviteLink = lazy(() => import("@/pages/InviteLink"));
const CreateCompany = lazy(() => import("@/pages/CreateCompany"));
const InviteTeam = lazy(() => import("@/pages/InviteTeam"));
import { ErrorModal } from "@/components/ErrorModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SupportBar } from "@/components/SupportBar";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import PageLoading from "@/components/ui/page-loading.tsx";
import { MonitoringProvider } from "@/lib/monitoring";
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from "@/hooks/useKeyboardShortcuts";

export function shouldBypassAuth() {
  // Disable authentication bypass in production for security
  if (import.meta.env.PROD) {
    return false;
  }

  try {
    if (typeof window === "undefined") return false;
    
    const params = new URLSearchParams(window.location.search);
    if (params.get("bypassAuth") === "1") {
      console.warn("[DEV MODE] Authentication bypass enabled via URL parameter (?bypassAuth=1)");
      return true;
    }
    
    if (localStorage && localStorage.getItem("DEBUG_BYPASS") === "1") {
      console.warn("[DEV MODE] Authentication bypass enabled via localStorage (DEBUG_BYPASS=1)");
      return true;
    }
  } catch (e) {
    // ignore errors in SSR or when localStorage is blocked
  }
  
  return false;
}

// PatternInsights Wrapper Component
function PatternInsightsWrapper() {
  const { companyId: userCompanyId } = useAuth();
  return <PatternInsights companyId={userCompanyId || ""} />;
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    role,
    companyId: userCompanyId,
    needsCompanySelection,
  } = useAuth();
  const bypass = shouldBypassAuth();
  const location = useLocation();

  console.log("[ProtectedRouteDebug] Check:", {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    role,
    bypass,
    needsCompanySelection,
  });

  if (isLoading && !bypass) {
    console.log("[ProtectedRouteDebug] Loading...");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !bypass) {
    console.log(
      "[ProtectedRouteDebug] Not authenticated. Redirecting to /signin",
    );
    return <Navigate to="/signin" replace />;
  }

  // Multi-Company Selection Logic
  if (
    isAuthenticated &&
    needsCompanySelection &&
    location.pathname !== "/select-company" &&
    location.pathname !== "/join-company" &&
    location.pathname !== "/create-company" &&
    !location.pathname.startsWith("/callback") &&
    !location.pathname.startsWith("/invite/")
  ) {
    console.log(
      "[ProtectedRouteDebug] Needs company selection. Redirecting to /select-company",
    );
    return <Navigate to="/select-company" replace />;
  }

  // RBAC Redirection Logic
  if (role === "client") {
    const allowedClientRoutes = [
      "/portal",
      "/history",
      "/track-job",
      "/settings",
      "/dashboard/jobs",
      "/triage",
    ];
    const isAllowed = allowedClientRoutes.some((route) =>
      location.pathname.startsWith(route),
    );

    // If client is trying to access restricted areas, redirect to portal
    if (!isAllowed) {
      console.log(
        "[ProtectedRouteDebug] Client restricted. Redirecting to /portal",
      );
      return <Navigate to="/portal" replace />;
    }
    // Render with Layout so clients see their scoped Sidebar
    return <Layout>{children}</Layout>;
  }

  // Technician Logic
  if (role === "technician" || role === "tech") {
    // Techs only allowed: /tech, /tools, /settings/profile (maybe), /help, /about
    // Explicitly BLOCK: /dashboard (executive), /settings/company, /dashboard/dispatch
    const blockedRoutes = [
      "/dashboard",
      "/settings/company",
      "/history",
      "/portal",
    ];
    // Allow /dashboard/jobs if it's their view? No, use /tech/jobs.

    // Simple block list approach
    const isBlocked = blockedRoutes.some((route) =>
      location.pathname.startsWith(route),
    );
    // Exception: /dashboard/jobs is blocked in favor of /tech

    // Actually, safest is to redirect /dashboard root to /tech
    if (
      location.pathname === "/dashboard" ||
      location.pathname.startsWith("/dashboard/dispatch")
    ) {
      console.log(
        "[ProtectedRouteDebug] Tech restricted from Exec Dashboard. Redirecting to /tech",
      );
      return <Navigate to="/tech" replace />;
    }
  }

  // Logic for Admin/Standard Users
  // If non-admin tries to access portal, redirect to dashboard
  if (location.pathname.startsWith("/portal") && role !== "admin") {
    console.log(
      "[ProtectedRouteDebug] Non-admin restricted. Redirecting to /dashboard",
    );
    return <Navigate to="/dashboard" replace />;
  }

  console.log("[ProtectedRouteDebug] Access Granted.");
  // Wrap protected pages in the app Layout for consistent navigation
  return <Layout>{children}</Layout>;
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    role,
    companyId: userCompanyId,
  } = useAuth();
  const bypass = shouldBypassAuth();

  if (isLoading && !bypass) {
    return <PageLoading message="Checking authentication..." />;
  }

  if (isAuthenticated || bypass) {
    // Redirect based on Role
    if (role === "client") {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

import { AnimatePresence, motion } from "framer-motion";

function AppRoutes() {
  const location = useLocation();
  const bypass = shouldBypassAuth();

  return (
    <AnimatePresence mode="wait">
      {bypass && <DevModeBanner isActive={bypass} />}
      <ErrorBoundary fallback={<PageLoading message="Application error. Please refresh." />}>
        <Suspense fallback={<PageLoading />}>
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/a2l-resources" element={<A2LLandingPage />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/stories" element={<WebStories />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/connect-provider" element={<IntegrationLanding />} />
          <Route path="/callback/:provider" element={<Callback />} />

          {/* Auth Routes */}
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />

          {/* Debug Routes */}
          <Route path="/stripe-debug" element={<StripeDebug />} />
          <Route path="/agent-sandbox" element={<AgentSandbox />} />

          {/* Client Portal Route */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Tracking Route */}
          <Route
            path="/track-job/:id"
            element={
              <ProtectedRoute>
                <ClientTrackJob />
              </ProtectedRoute>
            }
          />

          {/* Technician Routes */}
          <Route
            path="/tech"
            element={
              <ProtectedRoute>
                <JobBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tech/jobs/:id"
            element={
              <ProtectedRoute>
                <ActiveJob />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/company"
            element={
              <ProtectedRoute>
                <CompanySettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/team"
            element={
              <ProtectedRoute>
                <Team />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />

          {/* Protected Feature Routes */}
          <Route
            path="/advanced-reporting"
            element={
              <ProtectedRoute>
                <SubscriptionGuard requiredTier="pro">
                  <AdvancedReporting />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/troubleshooting"
            element={
              <ProtectedRoute>
                <Troubleshooting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diy-calculators"
            element={
              <ProtectedRoute>
                <DIYCalculators />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estimate-builder"
            element={
              <ProtectedRoute>
                <EstimateBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jobs/:id"
            element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/dispatch"
            element={
              <ProtectedRoute>
                <Dispatch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/triage"
            element={
              <ProtectedRoute>
                <TriageDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/fleet"
            element={
              <ProtectedRoute>
                <FleetDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clients/:id"
            element={
              <ProtectedRoute>
                <ClientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/career"
            element={
              <ProtectedRoute>
                <Career />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/standard-cycle"
            element={
              <ProtectedRoute>
                <StandardCycle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/refrigerant-comparison"
            element={
              <ProtectedRoute>
                <RefrigerantComparison />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/cascade-cycle"
            element={
              <ProtectedRoute>
                <CascadeCycle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/refrigerant-report"
            element={
              <ProtectedRoute>
                <ComplianceReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/refrigerant-inventory"
            element={
              <ProtectedRoute>
                <RefrigerantInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/leak-rate-calculator"
            element={
              <ProtectedRoute>
                <LeakRateCalculator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/warranty-scanner"
            element={
              <ProtectedRoute>
                <WarrantyScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/iaq-wizard"
            element={
              <ProtectedRoute>
                <IAQWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai/pattern-insights"
            element={
              <ProtectedRoute>
                <PatternInsightsWrapper />
              </ProtectedRoute>
            }
          />

          {/* Multi-Company Routes */}
          <Route
            path="/select-company"
            element={
              <ProtectedRoute>
                <SelectCompany />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join-company"
            element={
              <ProtectedRoute>
                <InviteLink />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invite/:slug"
            element={
              <ProtectedRoute>
                <InviteLink />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-company"
            element={
              <ProtectedRoute>
                <CreateCompany />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invite-team"
            element={
              <ProtectedRoute>
                <InviteTeam />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </AnimatePresence>
  );
}

function AppContent() {
  const { enabled, setEnabled, showHelp, setShowHelp } = useKeyboardShortcuts();
  
  return (
    <>
      <AppRoutes />
      <KeyboardShortcutsHelp 
        show={showHelp} 
        onClose={() => setShowHelp(false)}
        enabled={enabled}
        onToggle={() => setEnabled(!enabled)}
      />
    </>
  );
}

export default function App() {
  return (
    <SupabaseAuthProvider>
      <ToastProvider>
        <JobProvider>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <BrowserRouter>
              <MonitoringProvider>
                <AppContent />
              </MonitoringProvider>
              <SupportBar />
              <ErrorModal />
              <Toaster />
            </BrowserRouter>
          </ThemeProvider>
        </JobProvider>
      </ToastProvider>
    </SupabaseAuthProvider>
  );
}
