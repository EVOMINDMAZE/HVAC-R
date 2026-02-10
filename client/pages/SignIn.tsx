import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
  CheckCircle,
} from "lucide-react";
import {
  checkBiometricAvailability,
  getBiometricCredentials,
  storeCredentials,
  BiometricStatus,
} from "@/lib/biometricAuth";
import { Capacitor } from "@capacitor/core";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageContainer } from "@/components/PageContainer";

export function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricStatus, setBiometricStatus] =
    useState<BiometricStatus | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("code");

  useEffect(() => {
    if (isNative) {
      checkBiometricAvailability().then(setBiometricStatus);
    }
  }, [isNative]);

  useEffect(() => {
    if (inviteCode) {
      addToast({
        type: "info",
        title: "Join invitation",
        description: "Sign in to accept your invitation.",
      });
    }
  }, [inviteCode, addToast]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      const errorMsg =
        err.message || "Google sign in failed. Please try again.";
      setError(errorMsg);
      addToast({
        type: "error",
        title: "Google sign in failed",
        description: errorMsg,
      });
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const {
        user,
        error: signInError,
        role: userRole,
      } = await signIn(formData.email, formData.password);

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (user) {
        if (isNative && biometricStatus?.isAvailable) {
          await storeCredentials(formData.email, formData.password);
        }

        addToast({
          type: "success",
          title: "Welcome back!",
          description: "You have been signed in successfully",
        });

        if (inviteCode) {
          navigate(`/join-company?code=${inviteCode}`);
          return;
        }

        console.log("[SignIn] Login successful, role:", userRole);
        if (userRole === "client") {
          navigate("/portal");
        } else if (userRole === "technician") {
          navigate("/tech");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      const errorMsg =
        err.message || "Sign in failed. Please check your credentials.";
      setError(errorMsg);
      addToast({
        type: "error",
        title: "Sign in failed",
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      const creds = await getBiometricCredentials();
      if (!creds) {
        setError("Biometric verification failed or no saved credentials.");
        return;
      }

      const {
        user,
        error: signInError,
        role: userRole,
      } = await signIn(creds.email, creds.password);

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (user) {
        addToast({
          type: "success",
          title: "Welcome back!",
          description: "Signed in with biometrics",
        });
        if (userRole === "client") {
          navigate("/portal");
        } else if (userRole === "technician") {
          navigate("/tech");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Biometric sign in failed.");
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />
      <main className="py-12 sm:py-16">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <div className="space-y-6">
              <Link to="/" className="inline-flex">
                <picture>
                  <source srcSet="/logo-stacked.webp" type="image/webp" />
                  <img
                    src="/logo-stacked.png"
                    alt="ThermoNeural"
                    className="h-16 w-auto object-contain mix-blend-multiply dark:mix-blend-screen"
                  />
                </picture>
              </Link>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Welcome back
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold">
                  Sign in to your HVAC&R workspace.
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Access project history, compliance reports, and field-ready tools
                  for refrigeration and cryogenic systems.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Secure data storage and audit-ready exports.
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Team workflows for contractors and engineering groups.
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Mobile-ready access for field teams.
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
                <CardDescription>
                  Use your work email to access ThermoNeural.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {inviteCode && (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    You have a pending invitation. Sign in to continue.
                  </div>
                )}

                {isNative &&
                  biometricStatus?.isAvailable &&
                  biometricStatus?.hasCredentials && (
                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={handleBiometricSignIn}
                        variant="outline"
                        className="w-full"
                        disabled={biometricLoading || loading}
                      >
                        <Fingerprint className="h-4 w-4" />
                        {biometricLoading ? "Verifying..." : "Sign in with Face ID"}
                      </Button>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        Or
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    </div>
                  )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  Or continue with
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Need an account?{" "}
                  </span>
                  <Link to="/signup" className="text-primary hover:underline">
                    Create one
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
