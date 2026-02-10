import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useInviteAccept } from "@/hooks/useInviteAccept";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function JoinCompany() {
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get("code");
  const { user } = useSupabaseAuth();

  const {
    inviteValue,
    setInviteValue,
    isLoading,
    isValidating,
    validationResult,
    error,
    success,
    handleJoin,
  } = useInviteAccept({
    inviteType: "code",
    prefilledValue: codeParam || undefined,
  });

  // Auto-join when validation is successful and user is authenticated
  useEffect(() => {
    if (validationResult?.valid === true && user) {
      // We'll let the user click the join button instead of auto-joining
      // to avoid unexpected behavior
    }
  }, [validationResult, user]);

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
    if (validationResult?.valid === true) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (validationResult?.valid === false) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (inviteValue.length === 8 && error) {
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (isValidating) {
      return "Validating invite code...";
    }
    if (validationResult?.valid === true) {
      return (
        <span className="text-green-700 font-medium">
          Valid invite code for{" "}
          <span className="font-bold">{validationResult.company_name}</span>
          {validationResult.role && ` as ${validationResult.role}`}
        </span>
      );
    }
    if (validationResult?.valid === false) {
      return <span className="text-red-700">{validationResult.error || "Invalid or expired invite code"}</span>;
    }
    if (inviteValue.length === 8 && error) {
      return <span className="text-amber-700">{error}</span>;
    }
    if (inviteValue.length === 8) {
      return <span className="text-muted-foreground">Enter 8-character code above</span>;
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>Join Company - HVAC-R Pro</title>
        <meta
          name="description"
          content="Join an existing HVAC company using an invite code"
        />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border-t-4 border-t-cyan-500">
          <CardHeader>
            <CardTitle className="text-2xl">Join a Company</CardTitle>
            <CardDescription>
              Enter the 8-character invite code provided by your company administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <div className="relative">
                  <Input
                    id="invite-code"
                    placeholder="e.g., A1B2C3D4"
                    value={inviteValue}
                    onChange={(e) => setInviteValue(e.target.value)}
                    maxLength={8}
                    className={`pr-10 ${validationResult?.valid === true ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                    disabled={isLoading || success}
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getStatusIcon()}
                  </div>
                </div>
                <div className="min-h-[24px] text-sm">
                  {getStatusMessage()}
                </div>
              </div>

              {validationResult?.valid === true && (
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-800">Ready to join!</h4>
                      <p className="text-sm text-green-700">
                        You're joining <strong>{validationResult.company_name}</strong> as{" "}
                        <span className="capitalize">{validationResult.role}</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}



              {success && (
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-800">Success!</h4>
                      <p className="text-sm text-green-700">
                        You've successfully joined the company. Redirecting...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleJoin}
                  disabled={
                    isLoading ||
                    success ||
                    validationResult?.valid !== true
                  }
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining Company...
                    </>
                  ) : success ? (
                    "Redirecting..."
                  ) : user ? (
                    "Join Company"
                  ) : (
                    "Sign In to Join"
                  )}
                </Button>
              </div>

              {!user && (
                <p className="text-sm text-muted-foreground text-center">
                  Not signed in? You'll be redirected to sign in first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}