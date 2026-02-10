import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function SignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp, signInWithGoogle } = useSupabaseAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("code");

  useEffect(() => {
    if (inviteCode) {
      addToast({
        type: "info",
        title: "Join Invitation",
        description: "Create an account to join the organization.",
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
        err.message || "Google sign up failed. Please try again.";
      setError(errorMsg);
      addToast({
        type: "error",
        title: "Google Sign Up Failed",
        description: errorMsg,
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      const errorMsg = "Passwords don't match";
      setError(errorMsg);
      addToast({
        type: "warning",
        title: "Password Mismatch",
        description: errorMsg,
      });
      return;
    }

    if (formData.password.length < 6) {
      const errorMsg = "Password must be at least 6 characters long";
      setError(errorMsg);
      addToast({
        type: "warning",
        title: "Password Too Short",
        description: errorMsg,
      });
      return;
    }

    setLoading(true);

    try {
      const { user, error: signUpError } = await signUp(
        formData.email,
        formData.password,
      );

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (user) {
        addToast({
          type: "success",
          title: "Welcome to ThermoNeural!",
          description: "Please check your email to confirm your account",
        });
        
        if (inviteCode) {
          navigate(`/join-company?code=${inviteCode}`);
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || "Registration failed. Please try again.";
      setError(errorMsg);
      addToast({
        type: "error",
        title: "Registration Failed",
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
            <picture>
              <source srcSet="/logo-stacked.webp" type="image/webp" />
              <img
                src="/logo-stacked.png"
                alt="ThermoNeural"
                className="h-20 mx-auto w-auto object-contain mix-blend-multiply dark:mix-blend-screen"
              />
            </picture>
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
                SECURE REGISTRATION PROTOCOL
              </Badge>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3 tracking-tight font-mono">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
                SYSTEM REGISTRATION
              </span>
            </h2>
            <p className="text-center text-muted-foreground text-sm">
              Create secure credentials to access thermal analysis command interface.
            </p>
          </div>

          <GlassCardContent className="p-8 space-y-8">
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
                <Label htmlFor="password" className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="pl-10 pr-10 h-11 bg-background/50 border border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-mono text-foreground placeholder:text-muted-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? (
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
                {loading ? "Creating account..." : "Create Account"}{" "}
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
                Already have an account?{" "}
              </span>
              <Link
                to="/signin"
                className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors font-mono"
              >
                Sign in
              </Link>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </div>
  );
}
