import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export function Callback() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // OAuth params
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // Should contain integration_id
  const errorParam = searchParams.get("error");

  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [message, setMessage] = useState("Finalizing secure connection...");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    // ROBUST CODE EXTRACTION
    // URLSearchParams sometimes decodes '+' or handles special chars unexpectedly.
    // We fallback to manual regex if needed, but Google codes usually start with "4/".
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
        // Call the Edge Function to swap code for token
        const { data, error } = await supabase.functions.invoke(
          "oauth-token-exchange",
          {
            body: {
              provider,
              code: codeToUse,
              state, // This is the integration_id
              redirect_uri: currentRedirectUri,
            },
          },
        );

        if (error) throw error;
        if (data?.error) {
          // Capture debug info from the error response or context
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
        setMessage(
          "Successfully connected! Device data will start syncing shortly.",
        );
      } catch (err: any) {
        console.error("OAuth Error:", err);
        setStatus("error");
        setMessage(err.message || "Failed to exchange tokens.");
      }
    };

    // Delay slightly to ensure hydration? No, generally safe to run.
    exchangeToken();
  }, []); // Run once on mount (ignoring strict mode double-invoke for now is okay, or use ref)

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-cyan-100/50 to-transparent dark:from-cyan-900/20 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Card
          className={`shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-t-4 ${
            status === "processing"
              ? "border-cyan-500"
              : status === "success"
                ? "border-green-500"
                : "border-red-500"
          }`}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {status === "processing" && (
                <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle className="w-12 h-12 text-green-500" />
              )}
              {status === "error" && (
                <XCircle className="w-12 h-12 text-red-500" />
              )}
            </div>
            <CardTitle className="capitalize">
              {status === "processing"
                ? `Connecting ${provider}...`
                : status === "success"
                  ? "Connected!"
                  : "Connection Failed"}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          {status === "error" && (
            <CardContent className="text-center space-y-4">
              {debugInfo && (
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-left text-xs font-mono overflow-auto border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold mb-1 text-slate-500">
                    Debug Details:
                  </p>
                  <pre className="whitespace-pre-wrap break-all text-slate-600 dark:text-slate-300">
                    {debugInfo}
                  </pre>
                </div>
              )}
              <button
                onClick={() => navigate(-1)} // Go back to try again
                className="text-cyan-600 hover:underline text-sm"
              >
                Return to integration page
              </button>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
