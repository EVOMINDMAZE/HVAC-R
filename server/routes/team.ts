// Team routes using Supabase
import { RequestHandler } from "express";
import { supabaseAdmin } from "../utils/supabase";

// Helper to get user ID by email using RPC
async function getUserIdByEmail(email: string): Promise<string | null> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  const { data, error } = await supabaseAdmin.rpc("get_user_id_by_email", {
    user_email: email,
  });

  if (error) {
    console.warn(`RPC get_user_id_by_email failed for ${email}:`, error);
    return null;
  }

  return data || null;
}

// Helper to get user's company ID
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

export const getTeam: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { companyId } = await getUserCompanyId(user.id);
    if (!companyId) {
      return res
        .status(400)
        .json({ error: "User not associated with a company" });
    }

    // Get team members for this company from user_roles
    const { data: roleMembers, error: roleError } = await supabaseAdmin!
      .from("user_roles")
      .select("user_id, role")
      .eq("company_id", companyId)
      .order("role", { ascending: true });

    if (roleError) {
      console.error("Error fetching team members from user_roles:", roleError);
      return res.status(500).json({ error: "Failed to fetch team" });
    }

    // Get company owner(s) from companies table
    const { data: companyOwners, error: companyError } = await supabaseAdmin!
      .from("companies")
      .select("user_id")
      .eq("id", companyId);

    if (companyError) {
      console.error("Error fetching company owners:", companyError);
      return res.status(500).json({ error: "Failed to fetch team" });
    }

    // Combine members, ensuring no duplicates
    const allMembers = new Map<string, { user_id: string; role: string }>();

    // Add company owners as 'admin' role
    companyOwners?.forEach((owner) => {
      if (owner.user_id) {
        allMembers.set(owner.user_id, {
          user_id: owner.user_id,
          role: "admin",
        });
      }
    });

    // Add role members (will override if duplicate, but role from user_roles should be accurate)
    roleMembers?.forEach((member) => {
      allMembers.set(member.user_id, member);
    });

    // Get emails for each user
    const membersWithEmails = await Promise.all(
      Array.from(allMembers.values()).map(async (member) => {
        let email = "";
        try {
          // Get user email from auth.users via admin API
          const { data: userData, error: userError } =
            await supabaseAdmin!.auth.admin.getUserById(member.user_id);
          if (!userError && userData?.user?.email) {
            email = userData.user.email;
          }
        } catch (e) {
          console.warn(`Failed to fetch email for user ${member.user_id}:`, e);
        }
        return {
          user_id: member.user_id,
          role: member.role,
          email: email || undefined,
        };
      }),
    );

    return res.json({
      success: true,
      data: membersWithEmails,
    });
  } catch (error: unknown) {
    console.error("Error fetching team:", error);
    return res.status(500).json({ error: "Failed to fetch team" });
  }
};

export const inviteTeamMember: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { email, role, full_name, client_id } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: "Email and role are required" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Get current user's company and role
    const { companyId: currentUserCompanyId, role: currentUserRole } =
      await getUserCompanyId(user.id);
    if (!currentUserCompanyId || !currentUserRole) {
    return res
      .status(403)
      .json({ error: "Current user not associated with a company" });
  }

    // Permission check
    if (currentUserRole !== "admin" && currentUserRole !== "manager") {
      return res
        .status(403)
        .json({ error: "Only admins and managers can invite users" });
    }
    if (currentUserRole === "manager" && role === "admin") {
      return res.status(403).json({ error: "Managers cannot invite admins" });
    }

    // Check seat limits (exclude clients)
    if (role !== "client") {
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from("companies")
        .select("seat_limit")
        .eq("id", currentUserCompanyId)
        .single();

      if (companyError) {
        console.error("Error fetching company seat limit:", companyError);
        return res.status(500).json({ error: "Failed to check seat limits" });
      }

      const seatLimit = companyData?.seat_limit || 5;

      const { count, error: countError } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", currentUserCompanyId)
        .in("role", ["admin", "manager", "tech"]);

      if (countError) {
        console.error("Error counting team members:", countError);
        return res.status(500).json({ error: "Failed to check seat limits" });
      }

      if ((count || 0) >= seatLimit) {
        return res.status(400).json({
          error: `Seat limit reached (${count}/${seatLimit}). Please upgrade your plan.`,
        });
      }
    }

    // Client invitations must be scoped to a specific client record.
    // We allow passing `client_id`, or we will resolve/create one using contact_email.
    let resolvedClientId: string | null = null;
    if (role === "client") {
      // Resolve provided client_id and ensure it belongs to inviter's company.
      if (client_id && typeof client_id === "string") {
        const { data: clientRow, error: clientErr } = await supabaseAdmin
          .from("clients")
          .select("id, company_id")
          .eq("id", client_id)
          .maybeSingle();

        if (clientErr) {
          console.error("Error validating client_id:", clientErr);
          return res.status(500).json({ error: "Failed to validate client" });
        }

        if (!clientRow || clientRow.company_id !== currentUserCompanyId) {
          return res.status(400).json({
            error: "Invalid client_id for this company",
          });
        }

        resolvedClientId = clientRow.id;
      } else {
        // Try to find an existing client by contact email.
        const { data: existingClient, error: findErr } = await supabaseAdmin
          .from("clients")
          .select("id")
          .eq("company_id", currentUserCompanyId)
          .eq("contact_email", email)
          .maybeSingle();

        if (findErr) {
          console.error("Error resolving client by contact_email:", findErr);
          return res.status(500).json({ error: "Failed to resolve client" });
        }

        if (existingClient?.id) {
          resolvedClientId = existingClient.id;
        } else {
          // Create a minimal client record so the invited user can be scoped correctly.
          const derivedName =
            typeof full_name === "string" && full_name.trim()
              ? full_name.trim()
              : String(email).split("@")[0] || "Client";

          const { data: createdClient, error: createErr } = await supabaseAdmin
            .from("clients")
            .insert({
              company_id: currentUserCompanyId,
              name: derivedName,
              contact_email: email,
            })
            .select("id")
            .single();

          if (createErr) {
            console.error("Error creating client for invitation:", createErr);
            return res
              .status(500)
              .json({ error: "Failed to create client for invitation" });
          }

          resolvedClientId = createdClient.id;
        }
      }
    }

    let newUserId: string | null = null;

    // Try to get existing user ID by email
    newUserId = await getUserIdByEmail(email);

    if (!newUserId) {
      // User doesn't exist, invite them
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: full_name || "",
            invited_by: user.id,
            company_id: currentUserCompanyId,
            // For client portal invites, we must keep the invited user scoped.
            client_id: resolvedClientId,
          },
          redirectTo: "https://hvac-r.app/dashboard",
        });

      if (inviteError) {
        // If user already exists (email_exists error), try to get their ID again
        if (
          (inviteError as any).status === 422 &&
          (inviteError as any).code === "email_exists"
        ) {
          newUserId = await getUserIdByEmail(email);
          if (!newUserId) {
            return res.status(400).json({
              error: "User already exists but could not retrieve user ID",
            });
          }
        } else {
          console.error("Error inviting user:", inviteError);
          return res
            .status(500)
            .json({ error: `Failed to invite user: ${inviteError.message}` });
        }
      } else {
        newUserId = inviteData.user.id;
      }
    }

    // If newUserId is still null, it might be due to user existing but we failed to get ID
    // or the invite flow didn't return user object as expected (if email confirmation is on)
    if (!newUserId) {
        // One last try to get ID if it exists
        newUserId = await getUserIdByEmail(email);
        if (!newUserId) {
             return res.status(500).json({ error: "Failed to get or create user ID" });
        }
    }

    // Create/update user_roles entry
    const { error: upsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: newUserId,
        role: role,
        company_id: currentUserCompanyId,
        client_id: role === "client" ? resolvedClientId : null,
      });

    if (upsertError) {
      console.error("Error upserting user role:", upsertError);
      return res.status(500).json({ error: "Failed to assign role" });
    }

    console.log(`Team member invited: ${email} as ${role}`);

    return res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      user: newUserId,
      emailStatus: "Sent",
    });
  } catch (error: unknown) {
    console.error("Error inviting team member:", error);
    return res.status(500).json({ error: "Failed to invite team member" });
  }
};

export const updateTeamMemberRole: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { userId, newRole } = req.body;
    if (!userId || !newRole) {
      return res
        .status(400)
        .json({ error: "User ID and new role are required" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Get current user's role
    const { role: currentUserRole, companyId: currentUserCompanyId } =
      await getUserCompanyId(user.id);

    if (currentUserRole !== "admin") {
      return res.status(403).json({ error: "Only admins can update roles" });
    }

    // Update role scoped to the same company
    const { error: updateError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId)
      .eq("company_id", currentUserCompanyId);

    if (updateError) {
      console.error("Error updating role:", updateError);
      return res.status(500).json({ error: "Failed to update role" });
    }

    return res.json({
      success: true,
      message: `Role updated to ${newRole}`,
    });
  } catch (error: unknown) {
    console.error("Error updating team member role:", error);
    return res.status(500).json({ error: "Failed to update role" });
  }
};

export const removeTeamMember: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (user.id === userId) {
      return res.status(400).json({ error: "Cannot remove yourself" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Get current user's role
    const { role: currentUserRole, companyId: currentUserCompanyId } =
      await getUserCompanyId(user.id);

    if (currentUserRole !== "admin") {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    // Remove user from company (delete user_roles entry for this company)
    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("company_id", currentUserCompanyId);

    if (deleteError) {
      console.error("Error removing team member:", deleteError);
      return res.status(500).json({ error: "Failed to remove team member" });
    }

    return res.json({
      success: true,
      message: "Member removed",
    });
  } catch (error: unknown) {
    console.error("Error removing team member:", error);
    return res.status(500).json({ error: "Failed to remove team member" });
  }
};
