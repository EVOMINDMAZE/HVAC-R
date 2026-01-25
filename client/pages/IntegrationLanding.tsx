import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldCheck, CheckCircle, ArrowRight, Globe } from "lucide-react";
import { motion } from "framer-motion";

export function IntegrationLanding() {
    const [searchParams] = useSearchParams();
    const integrationId = searchParams.get("integration_id");

    // State
    const [provider, setProvider] = useState<string>("Smart Device");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Invite Info on Load
    React.useEffect(() => {
        async function fetchInvite() {
            if (!integrationId) {
                setError("Missing Integration ID");
                setIsFetching(false);
                return;
            }

            try {
                // Call the "Public Guard" function
                // We use the anon client (no auth required)
                const { data, error } = await supabase.rpc('get_public_invite_info', {
                    invite_id: integrationId
                });

                if (error) throw error;
                if (data.error) throw new Error(data.error);

                // Normalize 'nest' to 'google_nest' for consistency
                const rawProvider = data.provider || "Smart Device";
                setProvider(rawProvider === 'nest' ? 'google_nest' : rawProvider);
                setReplyTo(data.reply_to || "Your Technician");

                if (data.status === 'active') {
                    setIsConnected(true);
                }
            } catch (err: any) {
                console.error("Error fetching invite:", err);
                setError("Invalid or Expired Invitation Code.");
            } finally {
                setIsFetching(false);
            }
        }

        fetchInvite();
    }, [integrationId]);

    const handleConnect = async () => {
        setIsLoading(true);

        // --- PRODUCTION OAUTH FLOW ---
        // 1. Construct the Provider's OAuth URL
        // const clientId = "YOUR_HONEYWELL_OR_SENSIBO_CLIENT_ID";
        // const redirectUri = encodeURIComponent(`${window.location.origin}/callback/${provider.toLowerCase()}`);
        // const state = integrationId; // Pass the ID to track it back
        // const targetUrl = `https://home.sensibo.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;

        // 2. Redirect the user
        // window.location.href = targetUrl;

        // --- 1. DETERMINE REDIRECT URL ---
        let targetUrl = '';
        const redirectUri = encodeURIComponent(`${window.location.origin}/callback/${provider?.toLowerCase()}`);

        // Note: These keys will eventually come from an API call or Env vars, 
        // but for the frontend redirect we might need them exposed or fetched.
        // For now, checks against the Provider type.

        if (provider?.toLowerCase() === 'google_nest') {
            // GOOGLE NEST OAUTH
            // Project ID from Device Access Console
            const projectId = 'c321831e-ae63-48ad-af14-e204165c1c8d';
            const clientId = '912049482369-scnb1851iq78mi5bvi22bj8tpav797uk.apps.googleusercontent.com';

            targetUrl = `https://nestservices.google.com/partnerconnections/${projectId}/auth?redirect_uri=${redirectUri}&access_type=offline&prompt=consent&client_id=${clientId}&response_type=code&scope=https://www.googleapis.com/auth/sdm.service`;

            // To test without keys, use simulation below:
            // targetUrl = ''; 
        } else if (provider?.toLowerCase() === 'honeywell') {
            const clientId = 'HONEYWELL_CLIENT_ID_PLACEHOLDER';
            targetUrl = `https://api.honeywell.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${integrationId}`;
        }

        // --- 2. EXECUTE REDIRECT ---
        if (targetUrl && !targetUrl.includes('PLACEHOLDER')) {
            window.location.href = targetUrl;
        } else {
            // --- SIMULATION FALLBACK (For Dev/Testing) ---
            console.warn("Using Simulation Redirect (Missing Keys)");
            setTimeout(() => {
                const callbackUrl = `/callback/${(provider || 'device').toLowerCase()}?code=TEST_AUTH_CODE&state=${integrationId}`;
                window.location.href = callbackUrl;
            }, 1000);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Access Denied</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        ThermoNeural
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Secure Integration Portal</p>
                </div>

                {!isConnected ? (
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                                <Globe className="w-8 h-8" />
                            </div>
                            <CardTitle className="text-xl">Connect {provider}</CardTitle>
                            <CardDescription className="text-center max-w-xs mx-auto pt-2">
                                <strong>{replyTo}</strong> requests permission to access devices and telemetry from your {provider} account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-slate-200">Data Access:</p>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        <li>View device list and status</li>
                                        <li>Read temperature and humidity</li>
                                        <li>Monitor connectivity</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                                <Lock className="w-3 h-3" />
                                End-to-end encrypted connection
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base shadow-lg shadow-blue-500/20"
                                onClick={handleConnect}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center animate-pulse">
                                        Connecting...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        Authorize Securely <ArrowRight className="w-4 h-4 ml-2" />
                                    </span>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 shadow-xl">
                        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-4"
                            >
                                <CheckCircle className="w-10 h-10" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connected!</h2>
                            <p className="text-slate-600 dark:text-slate-300 max-w-xs">
                                Your {provider} account has been successfully linked. You can close this window now.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <p className="text-center text-xs text-slate-400 mt-8">
                    &copy; {new Date().getFullYear()} ThermoNeural Inc. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
