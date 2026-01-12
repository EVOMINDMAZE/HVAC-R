import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { useJob } from "@/context/JobContext";

export function useSkillTracker() {
    const { user } = useSupabaseAuth();
    const { currentJob } = useJob();
    const { addToast } = useToast();

    const trackSkill = async (skillType: string, metadata?: any) => {
        if (!user) return;

        try {
            // Calculate dynamic XP based on complexity if needed
            const xp = 15;

            const { error } = await supabase
                .from('skill_logs')
                .insert({
                    user_id: user.id,
                    project_id: currentJob?.id,
                    skill_type: skillType,
                    xp_value: xp,
                    metadata: metadata
                });

            if (!error) {
                addToast({
                    type: 'success',
                    title: `Skill Verified! +${xp} XP`,
                    description: `Logged experience in ${skillType}`,
                    duration: 4000
                });
            }
        } catch (e) {
            console.error("Failed to track skill", e);
        }
    };

    return { trackSkill };
}
