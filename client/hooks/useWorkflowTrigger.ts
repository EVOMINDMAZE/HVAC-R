import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { useSupabaseAuth } from './useSupabaseAuth';

/**
 * Hook to trigger n8n workflows via Supabase Database Queue.
 * Guarantees execution even if internet blips.
 */
export function useWorkflowTrigger() {
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const triggerWorkflow = useCallback(async (
        workflowType: string,
        payload: any,
        onComplete?: (result: any) => void,
        onError?: (error: Error) => void
    ) => {
        setIsProcessing(true);

        if (!user) {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to trigger workflows.",
                variant: "destructive",
            });
            setIsProcessing(false);
            return;
        }

        let cleanupFn: (() => void) | null = null;
        let pollInterval: NodeJS.Timeout | null = null;
        let pollAttempts = 0;
        const MAX_POLL_ATTEMPTS = 30; // 30 seconds timeout

        // Cleanup function to reset state
        const cleanup = () => {
            if (cleanupFn) cleanupFn();
            if (pollInterval) clearInterval(pollInterval);
            setIsProcessing(false);
        };

        try {
            // 1. Insert Request
            const { data: request, error: insertError } = await supabase
                .from('workflow_requests')
                .insert({
                    user_id: user.id,
                    workflow_type: workflowType,
                    status: 'pending',
                    input_payload: payload
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // 2. Setup Realtime Subscription
            const channel = supabase
                .channel(`workflow-${request.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'workflow_requests',
                        filter: `id=eq.${request.id}`,
                    },
                    (payload) => {
                        const newStatus = payload.new.status;
                        const result = payload.new.result_payload;
                        const error = payload.new.error_message;

                        if (newStatus === 'completed') {
                            toast({
                                title: "Success! \u2705",
                                description: "Workflow completed successfully.",
                                variant: "default",
                            });
                            if (onComplete) onComplete(result);
                            cleanup();
                        } else if (newStatus === 'failed') {
                            toast({
                                title: "Workflow Failed",
                                description: error || "An unknown error occurred.",
                                variant: "destructive",
                            });
                            if (onError) onError(new Error(error));
                            cleanup();
                        }
                    }
                )
                .subscribe();

            cleanupFn = () => supabase.removeChannel(channel);

            // 3. Start Polling Fallback (with Timeout)
            pollInterval = setInterval(async () => {
                pollAttempts++;

                // Check for timeout
                if (pollAttempts > MAX_POLL_ATTEMPTS) {
                    cleanup();
                    toast({
                        title: "Timeout",
                        description: "The request took too long to complete. Please check your dashboard.",
                        variant: "destructive"
                    });
                    return;
                }

                const { data: current } = await supabase
                    .from('workflow_requests')
                    .select('status, result_payload, error_message')
                    .eq('id', request.id)
                    .single();

                if (current) {
                    if (current.status === 'completed') {
                        toast({
                            title: "Success! \u2705",
                            description: "Workflow completed successfully.",
                            variant: "default",
                        });
                        if (onComplete) onComplete(current.result_payload);
                        cleanup();
                    } else if (current.status === 'failed') {
                        toast({
                            title: "Workflow Failed",
                            description: current.error_message || "Failed.",
                            variant: "destructive",
                        });
                        if (onError) onError(new Error(current.error_message));
                        cleanup();
                    }
                }
            }, 1000);

        } catch (error: any) {
            console.error('[Workflow] Error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to trigger workflow.",
                variant: "destructive",
            });
            cleanup();
        }
    }, [user, toast]);

    return { triggerWorkflow, isProcessing };
}
