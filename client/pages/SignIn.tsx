import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";
import {
  checkBiometricAvailability,
  getBiometricCredentials,
  storeCredentials,
  BiometricStatus,
} from "@/lib/biometricAuth";
import { Capacitor } from "@capacitor/core";

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

  // Check biometric availability on mount
  useEffect(() => {
    if (isNative) {
      checkBiometricAvailability().then(setBiometricStatus);
    }
  }, [isNative]);

  useEffect(() => {
    if (inviteCode) {
      addToast({
        type: "info",
        title: "Join Invitation",
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
        title: "Google Sign In Failed",
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
        // Store credentials for biometric login next time (only on native)
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

        // Navigate based on role returned from signIn
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
        title: "Sign In Failed",
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Futuristic Security Grid */}
      <div className="absolute inset-0 z-0 bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-highlight/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/logo-stacked.png"
              alt="ThermoNeural"
              className="h-20 mx-auto w-auto object-contain mix-blend-multiply dark:mix-blend-screen"
            />
          </Link>
        </div>

        <GlassCard variant="command" className="rounded-2xl p-1 border border-primary/20 max-w-md w-full" glow={true}>

          <div className="p-8 border-b border-primary/20">
            <div className="flex items-center justify-center mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px] sm:text-xs"
              >
                <Lock className="w-3 h-3 mr-2" />
                SECURE ACCESS PROTOCOL
              </Badge>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3 tracking-tight font-mono">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
                SYSTEM AUTHENTICATION
              </span>
            </h2>
            <p className="text-center text-muted-foreground text-sm">
              Verify identity to access thermal analysis command interface.
            </p>
          </div>

          <GlassCardContent className="p-8 space-y-8">
            {/* Face ID / Touch ID Button (Native Only, when available) */}
            {isNative &&
              biometricStatus?.isAvailable &&
              biometricStatus?.hasCredentials && (
                <>
                  <Button
                    type="button"
                    onClick={handleBiometricSignIn}
                    variant="neonSuccess"
                    size="lg"
                    className="w-full font-mono tracking-wider"
                    disabled={biometricLoading || loading}
                  >
                    <Fingerprint className="h-5 w-5" />
                    {biometricLoading ? "Verifying..." : "Sign in with Face ID"}
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-primary/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground font-mono tracking-widest">
                        Or
                      </span>
                    </div>
                  </div>
                </>
              )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-11 bg-background/50 border border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-mono text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 font-mono"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="pl-10 pr-10 h-11 bg-background/50 border border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-mono text-foreground placeholder:text-muted-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors"
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
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-mono"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                variant="neonHighlight"
                size="lg"
                className="w-full font-mono tracking-wider"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-mono tracking-widest">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-11 border-primary/30 hover:border-primary hover:bg-primary/10 font-mono tracking-wider transition-colors"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                Don't have an account?{" "}
              </span>
              <Link
                to="/signup"
                className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors font-mono"
              >
                Create account
              </Link>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </div>
  );
}
