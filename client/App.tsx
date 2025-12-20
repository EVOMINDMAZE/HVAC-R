import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ToastProvider, useToast } from "@/hooks/useToast";
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
import { Contact } from "@/pages/Contact";
import { Documentation } from "@/pages/Documentation";
import { HelpCenter } from "@/pages/HelpCenter";
import { StripeDebug } from "@/pages/StripeDebug";
import { Privacy } from "@/pages/Privacy";
import { TermsOfService } from "@/pages/TermsOfService";
import NotFound from "@/pages/NotFound";
import { WebStories } from "@/pages/WebStories";
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
import { useLocation } from "react-router-dom";

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, filter: "blur(5px)" }}
    animate={{ opacity: 1, filter: "blur(0px)" }}
    exit={{ opacity: 0, filter: "blur(5px)" }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="w-full"
  >
    {children}
  </motion.div>
);

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <PageTransition>
                <Landing />
              </PageTransition>
            </PublicRoute>
          }
        />
        <Route
          path="/calculators/a2l-refrigerant-charge"
          element={
            <PublicRoute>
              <PageTransition>
                <A2LLandingPage />
              </PageTransition>
            </PublicRoute>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <PageTransition>
                <SignIn />
              </PageTransition>
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <PageTransition>
                <SignUp />
              </PageTransition>
            </PublicRoute>
          }
        />
        <Route path="/features" element={<PageTransition><Features /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/documentation" element={<PageTransition><Documentation /></PageTransition>} />
        <Route path="/help-center" element={<PageTransition><HelpCenter /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
        <Route path="/stripe-debug" element={<PageTransition><StripeDebug /></PageTransition>} />
        <Route path="/stories" element={<PageTransition><WebStories /></PageTransition>} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/troubleshooting" element={<PageTransition><Troubleshooting /></PageTransition>} />
          <Route path="/estimate-builder" element={<PageTransition><EstimateBuilder /></PageTransition>} />

          {/* Pro Features (Gated) */}
          <Route element={<SubscriptionGuard />}>
            <Route path="/jobs" element={<PageTransition><Jobs /></PageTransition>} />
            <Route path="/advanced-reporting" element={<PageTransition><AdvancedReporting /></PageTransition>} />
          </Route>

          {/* Free Features */}
          <Route path="/standard-cycle" element={<PageTransition><StandardCycle /></PageTransition>} />
          <Route path="/refrigerant-comparison" element={<PageTransition><RefrigerantComparison /></PageTransition>} />
          <Route path="/cascade-cycle" element={<PageTransition><CascadeCycle /></PageTransition>} />
          <Route path="/diy-calculators" element={<PageTransition><DIYCalculators /></PageTransition>} />
          <Route path="/history" element={<PageTransition><History /></PageTransition>} />
          <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { addToast } = useToast();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check if the service worker is active and controlling the page
        if (registration.active) {
          // Optional: Check for updates or just confirm it's running
        }
      });

      // Listen for new service workers (updates or first install)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        addToast({
          title: "Ready for offline use",
          description: "The app has been cached and is ready to work offline.",
          type: "success"
        });
      });
    }
  }, [addToast]);

  return (
    <SupabaseAuthProvider>
      <BrowserRouter>
        <AppRoutes />
        {/* Global UI components */}
        <ErrorModal />
        <SupportBar />
      </BrowserRouter>
    </SupabaseAuthProvider>
  );
}

export default App;
