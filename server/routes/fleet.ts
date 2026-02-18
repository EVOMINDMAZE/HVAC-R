import { RequestHandler } from "express";
import { supabaseAdmin } from "../utils/supabase.js";

// Helper to get user's company ID (duplicated from team.ts for now)
async function getUserCompanyId(
  userId: string,
): Promise<{ companyId: string | null; role: string | null }> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  // First check user_roles table
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("company_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!roleError && roleData) {
    return { companyId: roleData.company_id, role: roleData.role };
  }

  // Fallback: check if user owns a company
  const { data: companyData, error: companyError } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!companyError && companyData) {
    return { companyId: companyData.id, role: "admin" };
  }

  return { companyId: null, role: null };
}

export const getFleetStatus: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const { companyId } = await getUserCompanyId(user.id);
    if (!companyId) {
    // If user has no company (e.g. client), they shouldn't see fleet data
    return res.status(403).json({ error: "Access denied: No company association" });
  }

    // 1. Fetch all technicians for the company
    const { data: techs, error: techError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("company_id", companyId)
      .eq("role", "tech");

    if (techError) {
      console.error("Error fetching techs:", techError);
      return res.status(500).json({ error: "Failed to fetch fleet status" });
    }

    // 2. Fetch active jobs for the company
    // Assuming 'jobs' table has company_id and status
    // Statuses: 'pending', 'scheduled', 'in_progress', 'completed'
    const { data: activeJobs, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("company_id", companyId)
      .neq("status", "completed")
      .neq("status", "cancelled");

    if (jobError) {
        // If jobs table doesn't exist or error, we log but continue with empty jobs
        console.warn("Error fetching jobs:", jobError);
    }

    const jobs = activeJobs || [];

    // 3. Aggregate data
    const fleetStatus = await Promise.all(
      (techs || []).map(async (tech) => {
        // Get user details
        const { data: userData } = await supabaseAdmin!.auth.admin.getUserById(tech.user_id);
        const name = userData?.user?.user_metadata?.full_name || 
                     `${userData?.user?.user_metadata?.first_name || ''} ${userData?.user?.user_metadata?.last_name || ''}`.trim() || 
                     userData?.user?.email || "Unknown Tech";

        // Find active job
        // Logic: if job is 'in_progress' assigned to tech -> working
        // if job is 'scheduled' and close to now -> en-route? (Simplification: just use status)
        const currentJob = jobs.find(j => j.technician_id === tech.user_id && j.status === 'in_progress');
        const nextJob = jobs.find(j => j.technician_id === tech.user_id && j.status === 'scheduled');

        let status = 'idle';
        let jobTitle = undefined;

        if (currentJob) {
            status = 'working';
            jobTitle = currentJob.title || currentJob.job_name;
        } else if (nextJob) {
            // Simple heuristic
            status = 'en-route'; 
            jobTitle = nextJob.title || nextJob.job_name;
        }

        return {
          id: tech.user_id,
          name,
          status,
          current_job: jobTitle,
          last_seen: new Date().toISOString() // Placeholder as we don't have presence yet
        };
      })
    );

    return res.json({
      success: true,
      data: {
        techs: fleetStatus,
        jobs: jobs.map(j => ({
            id: j.id,
            title: j.title || j.job_name,
            client: j.client_name, // Assuming client_name column exists as seen in schema check
            status: j.status,
            tech_assigned: fleetStatus.find(t => t.id === j.technician_id)?.name
        }))
      }
    });

  } catch (error: unknown) {
    console.error("Error getting fleet status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
