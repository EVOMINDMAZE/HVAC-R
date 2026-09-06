import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { KeyRound, Loader2, MailCheck, ShieldCheck } from "lucide-react";

type Mode = "request" | "token" | "change";

function readRecoveryFragment(): { accessToken: string | null; refreshToken: string | null } {
  // Supabase recovery links deliver tokens in the URL fragment:
  // #access_token=...&refresh_token=...&type=recovery
  const frag = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(frag);
  const type = params.get("type");
  if (type !== "recovery") {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
  };
}

export function ResetPassword() {
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailedTo, setEmailedTo] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const tokenHandled = useRef(false);

  useEffect(() => {
    if (tokenHandled.current) return;
    tokenHandled.current = true;
    const { accessToken, refreshToken } = readRecoveryFragment();
    if (accessToken && refreshToken) {
      setMode("token");
      setBusy(true);
      (async () => {
        try {
          const { error: sessError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessError) throw sessError;
          // Clear the tokens out of the address bar.
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        } catch {
          setError(
            "This reset link is invalid or has expired. Request a new one below.",
          );
          setMode("request");
        } finally {
          setBusy(false);
        }
      })();
    }
  }, []);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (resetError) throw resetError;
      setEmailedTo(email.trim());
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Could not send the reset email. Please try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Could not update the password. Please try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            <h1>Reset your password</h1>
          </CardTitle>
          <CardDescription>
            {done
              ? "Your password has been changed."
              : mode === "change" || mode === "token"
                ? "Choose a new password for your account."
                : "Enter your work email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {done ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Password updated. Use it next time you sign in.
              </div>
              <Button asChild className="w-full">
                <Link to="/signin">Back to sign in</Link>
              </Button>
            </div>
          ) : emailedTo ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <MailCheck className="h-4 w-4 text-primary" />
                Reset link sent to {emailedTo}. Check your inbox — the link
                expires soon.
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailedTo(null);
                  setEmail("");
                }}
              >
                Use a different email
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/signin">Back to sign in</Link>
              </Button>
            </div>
          ) : mode === "token" && !error ? (
            busy ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying reset link…
              </div>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-password">New password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">
                    Confirm new password
                  </Label>
                  <Input
                    id="confirm-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Set new password"
                  )}
                </Button>
              </form>
            )
          ) : (
            <form onSubmit={handleRequestLink} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Work email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/signin">Back to sign in</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
