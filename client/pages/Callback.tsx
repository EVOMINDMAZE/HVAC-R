
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState("Finalizing secure connection...");

    useEffect(() => {
        if (errorParam) {
            setStatus('error');
            setMessage(`Provider declined the request: ${errorParam}`);
            return;
        }

        if (!code) {
            setStatus('error');
            setMessage("Invalid response: Missing authorization code.");
            return;
        }

        const exchangeToken = async () => {
            try {
                // Call the Edge Function to swap code for token
                const { data, error } = await supabase.functions.invoke('oauth-token-exchange', {
                    body: {
                        provider,
                        code,
                        state, // This is the integration_id 
                        redirect_uri: window.location.origin + `/callback/${provider}`
                    }
                });

                if (error) throw error;
                if (data?.error) throw new Error(data.error);

                setStatus('success');
                setMessage("Successfully connected! Device data will start syncing shortly.");

            } catch (err: any) {
                console.error("OAuth Error:", err);
                setStatus('error');
                setMessage(err.message || "Failed to exchange tokens.");
            }
        };

        exchangeToken();
    }, [code, provider, state, errorParam]); // dependencies

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className={`shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-t-4 ${status === 'processing' ? 'border-blue-500' :
                    status === 'success' ? 'border-green-500' : 'border-red-500'
                    }`}>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            {status === 'processing' && (
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                            )}
                            {status === 'success' && (
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            )}
                            {status === 'error' && (
                                <XCircle className="w-12 h-12 text-red-500" />
                            )}
                        </div>
                        <CardTitle className="capitalize">
                            {status === 'processing' ? `Connecting ${provider}...` :
                                status === 'success' ? 'Connected!' : 'Connection Failed'}
                        </CardTitle>
                        <CardDescription>
                            {message}
                        </CardDescription>
                    </CardHeader>
                    {status === 'error' && (
                        <CardContent className="text-center">
                            <button
                                onClick={() => navigate(-1)} // Go back to try again
                                className="text-blue-600 hover:underline text-sm"
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
