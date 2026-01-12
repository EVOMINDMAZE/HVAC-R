import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { useSupabaseAuth } from './useSupabaseAuth';

/**
 * Hook to trigger n8n workflows via Supabase Database Queue (Option A Architecture)
 * Guarantees execution even if internet blips.
 */
export function useWorkflowTrigger() {
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const triggerWorkflow = useCallback(async (
        workflowType: string,
        payload: any,
        onSuccess?: (result: any) => void
    ) => {
        if (!user) {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to run workflows",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Insert Request into Queue (Status: 'pending')
            const { data, error } = await supabase
                .from('workflow_requests')
                .insert({
                    user_id: user.id,
                    workflow_type: workflowType,
                    input_payload: payload,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            const requestId = data.id;

            // 2. Watch for Updates (Realtime)
            const channel = supabase
                .channel(`workflow-${requestId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'workflow_requests',
                        filter: `id=eq.${requestId}`
                    },
                    (payload) => {
                        const newStatus = payload.new.status;

                        if (newStatus === 'completed') {
                            toast({
                                title: "Success! ✅",
                                description: "Automation completed successfully."
                            });
                            setIsProcessing(false);
                            if (onSuccess) onSuccess(payload.new.result_payload);
                            supabase.removeChannel(channel);
                        }
                        else if (newStatus === 'failed') {
                            toast({
                                title: "Workflow Failed ❌",
                                description: payload.new.error_message || "Something went wrong.",
                                variant: "destructive"
                            });
                            setIsProcessing(false);
                            supabase.removeChannel(channel);
                        }
                    }
                )
                .subscribe();

        } catch (err: any) {
            console.error("Workflow Error:", err);
            toast({
                title: "Request Failed",
                description: err.message,
                variant: "destructive"
            });
            setIsProcessing(false);
        }
    }, [user, toast]);

    return { triggerWorkflow, isProcessing };
}
