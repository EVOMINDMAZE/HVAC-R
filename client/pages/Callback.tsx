import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";

export function Callback() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [message, setMessage] = useState("Finalizing secure connection...");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    let codeToUse = code;
    if (!codeToUse) {
      const match = window.location.search.match(/[?&]code=([^&]+)/);
      if (match) {
        codeToUse = decodeURIComponent(match[1]);
      }
    }

    if (errorParam) {
      setStatus("error");
      setMessage(`Provider declined the request: ${errorParam}`);
      return;
    }

    if (!codeToUse) {
      setStatus("error");
      setMessage("Invalid response: Missing authorization code.");
      return;
    }

    const currentRedirectUri = window.location.origin + `/callback/${provider}`;

    const exchangeToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "oauth-token-exchange",
          {
            body: {
              provider,
              code: codeToUse,
              state,
              redirect_uri: currentRedirectUri,
            },
          },
        );

        if (error) throw error;
        if (data?.error) {
          const info = `
provider: ${provider}
code_prefix: ${codeToUse?.substring(0, 5)}...
code_length: ${codeToUse?.length}
redirect_uri: ${currentRedirectUri}
error: ${data.error}
          `.trim();
          setDebugInfo(info);
          throw new Error(data.error);
        }

        setStatus("success");
        setMessage("Successfully connected! Device data will start syncing shortly.");
      } catch (err: any) {
        console.error("OAuth Error:", err);
        setStatus("error");
        setMessage(err.message || "Failed to exchange tokens.");
      }
    };

    exchangeToken();
  }, []);

  const statusBorder =
    status === "processing"
      ? "border-l-4 border-l-primary"
      : status === "success"
        ? "border-l-4 border-l-emerald-500"
        : "border-l-4 border-l-destructive";

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />
      <main className="py-16">
        <PageContainer>
          <div className="mx-auto max-w-xl">
            <Card className={statusBorder}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  {status === "processing" && (
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  )}
                  {status === "success" && (
                    <CheckCircle className="h-12 w-12 text-emerald-500" />
                  )}
                  {status === "error" && (
                    <XCircle className="h-12 w-12 text-destructive" />
                  )}
                </div>
                <CardTitle className="capitalize">
                  {status === "processing"
                    ? `Connecting ${provider}...`
                    : status === "success"
                      ? "Connection complete"
                      : "Connection failed"}
                </CardTitle>
                <CardDescription>{message}</CardDescription>
              </CardHeader>
              {status === "error" && (
                <CardContent className="space-y-4 text-sm">
                  {debugInfo && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-left font-mono text-xs whitespace-pre-wrap">
                      {debugInfo}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                      Return to integration
                    </Button>
                    <Button asChild>
                      <Link to="/connect-provider">View providers</Link>
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
