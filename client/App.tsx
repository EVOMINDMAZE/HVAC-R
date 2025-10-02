import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ToastProvider } from "@/hooks/useToast";
import "@/utils/authErrorHandler"; // Import to setup global error handling
import { Landing } from "@/pages/Landing";
import { Features } from "@/pages/Features";
import { Pricing } from "@/pages/Pricing";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import { Dashboard } from "@/pages/Dashboard";
import { Profile } from "@/pages/Profile";
import { History } from "@/pages/History";
import AdvancedReporting from "@/pages/AdvancedReporting";
import Troubleshooting from "@/pages/Troubleshooting";
import DIYCalculators from "@/pages/DIYCalculators";
import EstimateBuilder from "@/pages/EstimateBuilder";
import Projects from "@/pages/Projects";
import { StandardCycle } from "@/pages/StandardCycle";
import { RefrigerantComparison } from "@/pages/RefrigerantComparison";
import { CascadeCycle } from "@/pages/CascadeCycle";
import { About } from "@/pages/About";
import { Blog } from "@/pages/Blog";
import { Contact } from "@/pages/Contact";
import { Documentation } from "@/pages/Documentation";
import { HelpCenter } from "@/pages/HelpCenter";
import { ApiDocs } from "@/pages/ApiDocs";
import { StripeDebug } from "@/pages/StripeDebug";
import NotFound from "@/pages/NotFound";
import { ErrorModal } from "@/components/ErrorModal";
import { SupportBar } from "@/components/SupportBar";
import { Layout } from "@/components/Layout";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Wrap protected pages in the app Layout for consistent navigation
  return (
    <Layout>
      {children}
    </Layout>
  );
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />
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
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/api-docs" element={<ApiDocs />} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/stripe-debug" element={<StripeDebug />} />

      {/* Protected routes */}
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
        path="/advanced-reporting"
        element={
          <ProtectedRoute>
            <AdvancedReporting />
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
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
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
      <Route
        path="/standard-cycle"
        element={
          <ProtectedRoute>
            <StandardCycle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/refrigerant-comparison"
        element={
          <ProtectedRoute>
            <RefrigerantComparison />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cascade-cycle"
        element={
          <ProtectedRoute>
            <CascadeCycle />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <SupabaseAuthProvider>
        <BrowserRouter>
          <AppRoutes />
          {/* Global UI components */}
          <ErrorModal />
          <SupportBar />
        </BrowserRouter>
      </SupabaseAuthProvider>
    </ToastProvider>
  );
}

export default App;
