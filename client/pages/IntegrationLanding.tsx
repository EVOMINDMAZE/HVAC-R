import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, ShieldCheck, CheckCircle } from "lucide-react";

export function IntegrationLanding() {
  const [searchParams] = useSearchParams();
  const integrationId = searchParams.get("integration_id");

  const [provider, setProvider] = useState<string>("Smart Device");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function fetchInvite() {
      if (!integrationId) {
        setError("Missing Integration ID");
        setIsFetching(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_public_invite_info", {
          invite_id: integrationId,
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        const rawProvider = data.provider || "Smart Device";
        setProvider(rawProvider === "nest" ? "google_nest" : rawProvider);
        setReplyTo(data.reply_to || "Your Technician");

        if (data.status === "active") {
          setIsConnected(true);
        }
      } catch (err: any) {
        console.error("Error fetching invite:", err);
        setError("Invalid or expired invitation code.");
      } finally {
        setIsFetching(false);
      }
    }

    fetchInvite();
  }, [integrationId]);

  const handleConnect = async () => {
    setIsLoading(true);

    let targetUrl = "";
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/callback/${provider?.toLowerCase()}`,
    );

    if (provider?.toLowerCase() === "google_nest") {
      const projectId = "c321831e-ae63-48ad-af14-e204165c1c8d";
      const clientId =
        "912049482369-scnb1851iq78mi5bvi22bj8tpav797uk.apps.googleusercontent.com";

      targetUrl = `https://nestservices.google.com/partnerconnections/${projectId}/auth?redirect_uri=${redirectUri}&access_type=offline&prompt=consent&client_id=${clientId}&response_type=code&scope=https://www.googleapis.com/auth/sdm.service`;
    } else if (provider?.toLowerCase() === "honeywell") {
      const clientId = "HONEYWELL_CLIENT_ID_PLACEHOLDER";
      targetUrl = `https://api.honeywell.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${integrationId}`;
    }

    if (targetUrl && !targetUrl.includes("PLACEHOLDER")) {
      window.location.href = targetUrl;
    } else {
      console.warn("Using Simulation Redirect (Missing Keys)");
      setTimeout(() => {
        const callbackUrl = `/callback/${(provider || "device").toLowerCase()}?code=TEST_AUTH_CODE&state=${integrationId}`;
        window.location.href = callbackUrl;
      }, 1000);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-border/60">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Connect your device</CardTitle>
          <CardDescription>
            Securely link your {provider.replace("_", " ")} account to ThermoNeural.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-primary" />
            <span>Your credentials are handled by the provider.</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Connection can be revoked at any time.</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Invitation sent by {replyTo ?? "your technician"}.</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleConnect} disabled={isLoading}>
            {isLoading ? "Connecting..." : isConnected ? "Reconnect" : "Connect"}
          </Button>
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to share device data with ThermoNeural for analysis.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
