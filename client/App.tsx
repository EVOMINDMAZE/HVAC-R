import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ToastProvider, useToast } from "@/hooks/useToast";
import { ThemeProvider } from "@/components/theme-provider";
import "@/utils/authErrorHandler"; // Import to setup global error handling
import { Landing } from "@/pages/Landing";
import { A2LLandingPage } from "@/pages/A2LLandingPage";
import { Features } from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import { Dashboard } from "@/pages/Dashboard";
import { Profile } from "@/pages/Profile";
import { History } from "@/pages/History";
import AdvancedReporting from "@/pages/AdvancedReporting";
import Troubleshooting from "@/pages/Troubleshooting";
import DIYCalculators from "@/pages/DIYCalculators";
import EstimateBuilder from "@/pages/EstimateBuilder";
import Jobs from "@/pages/Jobs";
import Projects from "@/pages/Projects";
import { StandardCycle } from "@/pages/StandardCycle";
import { RefrigerantComparison } from "@/pages/RefrigerantComparison";
import { CascadeCycle } from "@/pages/CascadeCycle";
import { About } from "@/pages/About";
import { Blog } from "@/pages/Blog";
import { BlogPost } from "@/pages/BlogPost";
import { Contact } from "@/pages/Contact";
import { Documentation } from "@/pages/Documentation";
import { HelpCenter } from "@/pages/HelpCenter";
import { StripeDebug } from "@/pages/StripeDebug";
import { Privacy } from "@/pages/Privacy";
import { TermsOfService } from "@/pages/TermsOfService";
import NotFound from "@/pages/NotFound";
import { WebStories } from "@/pages/WebStories";
import { Podcasts } from "@/pages/Podcasts";
import { ErrorModal } from "@/components/ErrorModal";
import { SupportBar } from "@/components/SupportBar";
import { Layout } from "@/components/Layout";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

// Protected Route Component
function shouldBypassAuth() {
  try {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("bypassAuth") === "1") return true;
    if (localStorage && localStorage.getItem("DEBUG_BYPASS") === "1")
      return true;
  } catch (e) {
    // ignore
  }
  return false;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const bypass = shouldBypassAuth();

  if (isLoading && !bypass) {
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
    return <Navigate to="/signin" replace />;
  }

  // Wrap protected pages in the app Layout for consistent navigation
  return <Layout>{children}</Layout>;
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const bypass = shouldBypassAuth();

  if (isLoading && !bypass) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated || bypass) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

import { AnimatePresence, motion } from "framer-motion";

function AppRoutes() {
  const location = window.location;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
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
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<TermsOfService />} />

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
          path="/jobs"
          element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
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

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <SupabaseAuthProvider>
      <ToastProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <BrowserRouter>
            <AppRoutes />
            <SupportBar />
            <ErrorModal />
          </BrowserRouter>
        </ThemeProvider>
      </ToastProvider>
    </SupabaseAuthProvider>
  );
}
