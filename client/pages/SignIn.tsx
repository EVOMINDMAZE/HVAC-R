import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Mail, Lock, Eye, EyeOff } from "lucide-react";

export function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signInWithGoogle } = useSupabaseAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();

      if (error) {
        throw new Error(error.message);
      }

      // The redirect will handle navigation
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
      const { user, error: signInError } = await signIn(
        formData.email,
        formData.password,
      );

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (user) {
        addToast({
          type: "success",
          title: "Welcome back!",
          description: "You have been signed in successfully",
        });
        navigate("/dashboard");
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100 relative">
      {/* Warm/Thermo Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-red-100/40 dark:bg-red-900/20 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-100/30 dark:bg-indigo-900/20 blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 mb-6 no-underline"
          >
            <img
              src="/logo-stacked.png"
              alt="ThermoNeural"
              className="h-24 w-auto object-contain"
            />
          </Link>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-border shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-foreground">
              Welcome Back
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Continue with your HVAC&R calculations
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 border-input focus:border-blue-500 focus:ring-blue-500"
                    aria-invalid={error ? true : false}
                    aria-describedby={error ? "signin-error" : undefined}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                    className="pl-10 pr-10 border-input focus:border-blue-500 focus:ring-blue-500"
                    aria-describedby={error ? "signin-error" : undefined}
                    aria-invalid={error ? true : false}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                <div id="signin-error" role="alert" className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full border-input hover:bg-accent hover:text-accent-foreground"
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
              Continue with Google
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary hover:text-primary/90 hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
