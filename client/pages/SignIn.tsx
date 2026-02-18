import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import {
  checkBiometricAvailability,
  getBiometricCredentials,
  storeCredentials,
  BiometricStatus,
} from "@/lib/biometricAuth";
import { Capacitor } from "@capacitor/core";
import { PageContainer } from "@/components/PageContainer";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export function SignIn() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
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
      addToast({ type: "info", title: "Join invitation", description: "Sign in to accept your invitation." });
    }
  }, [inviteCode, addToast]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) throw new Error(error.message);
    } catch (err: any) {
      setError(err.message || "Google sign in failed.");
      addToast({ type: "error", title: "Google sign in failed", description: err.message });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { user, error: signInError, role: userRole } = await signIn(formData.email, formData.password);

      if (signInError) throw new Error(signInError.message);

      if (user) {
        if (isNative && biometricStatus?.isAvailable) {
          await storeCredentials(formData.email, formData.password);
        }

        addToast({ type: "success", title: "Welcome back!", description: "You have been signed in successfully" });

        if (inviteCode) {
          navigate(`/join-company?code=${inviteCode}`);
          return;
        }

        if (userRole === "client") {
          navigate("/portal");
        } else if (userRole === "technician" || userRole === "tech") {
          navigate("/tech");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Sign in failed.");
      addToast({ type: "error", title: "Sign in failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      const creds = await getBiometricCredentials();
      if (!creds) {
        setError("Biometric verification failed.");
        return;
      }

      const { user, error: signInError, role: userRole } = await signIn(creds.email, creds.password);

      if (signInError) throw new Error(signInError.message);

      if (user) {
        addToast({ type: "success", title: "Welcome back!", description: "Signed in with biometrics" });
        if (userRole === "client") {
          navigate("/portal");
        } else if (userRole === "technician" || userRole === "tech") {
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
    <PublicPageShell withFooter={false} mainClassName="py-12 sm:py-16">
      <PageContainer>
        <div className="signin-page">
          <div className="signin-page__brand">
            <Link to="/" className="signin-page__logo">
              <picture>
                <source srcSet="/logo-stacked.webp" type="image/webp" />
                <img src="/logo-stacked.png" alt="ThermoNeural" />
              </picture>
            </Link>

            <div className="signin-page__content">
              <span className="signin-page__kicker">Welcome back</span>
              <h1 className="signin-page__title">Sign in to your workspace</h1>
              <p className="signin-page__subtitle">
                Access project history, compliance reports, and field-ready tools for HVAC&R operations.
              </p>
            </div>

            <div className="signin-page__benefits">
              <div className="signin-page__benefit">
                <Shield className="w-5 h-5" />
                <span>Secure data storage and audit-ready exports</span>
              </div>
              <div className="signin-page__benefit">
                <Users className="w-5 h-5" />
                <span>Team workflows for contractors and engineers</span>
              </div>
              <div className="signin-page__benefit">
                <Zap className="w-5 h-5" />
                <span>Mobile-ready access for field teams</span>
              </div>
            </div>
          </div>

          <div className="signin-page__form">
            <div className="signin-card">
              <div className="signin-card__header">
                <h2 className="signin-card__title">Sign in</h2>
                <p className="signin-card__subtitle">Use your work email to access ThermoNeural</p>
              </div>

              {inviteCode && (
                <div className="signin-card__invite">
                  You have a pending invitation. Sign in to continue.
                </div>
              )}

              {isNative && biometricStatus?.isAvailable && biometricStatus?.hasCredentials && (
                <>
                  <Button
                    type="button"
                    onClick={handleBiometricSignIn}
                    variant="outline"
                    className="signin-card__biometric"
                    disabled={biometricLoading || loading}
                  >
                    <Fingerprint className="w-4 h-4" />
                    {biometricLoading ? "Verifying..." : "Sign in with Face ID"}
                  </Button>
                  <div className="signin-card__divider">
                    <span>Or</span>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="signin-card__form">
                <div className="signin-card__field">
                  <Label htmlFor="email">Email address</Label>
                  <div className="signin-card__input-wrap">
                    <Mail className="signin-card__input-icon" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="signin-card__input"
                      required
                    />
                  </div>
                </div>

                <div className="signin-card__field">
                  <div className="signin-card__field-header">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="signin-card__forgot">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="signin-card__input-wrap">
                    <Lock className="signin-card__input-icon" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      className="signin-card__input signin-card__input--password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="signin-card__toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <div className="signin-card__error">{error}</div>}

                <Button type="submit" className="signin-card__submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="signin-card__divider">
                <span>Or continue with</span>
              </div>

              <Button onClick={handleGoogleSignIn} variant="outline" className="signin-card__google" disabled={loading}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>

              <div className="signin-card__footer">
                <span>Need an account?</span>
                <Link to="/signup">Create one</Link>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </PublicPageShell>
  );
}