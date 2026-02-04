import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // 1. Authenticate Requesting User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: requester },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !requester) {
      console.error("Auth Error:", authError);
      throw new Error("Unauthorized");
    }

    // 2. Initial Body Parse
    const body = await req.json();
    const { email, role, full_name, client_id } = body;
    console.log(
      `Inviting user: email=${email}, role=${role}, full_name=${full_name}, client_id=${client_id}`,
    );
    const emailTrimmed = email.trim();
    if (!emailTrimmed || !role) throw new Error("Email and Role are required");

    if (role === "client" && !client_id) {
      throw new Error("Client ID is required when inviting a Client user.");
    }

    // 3. Verify Requester Permissions (Admin or Manager) AND Get Company ID
    // ... (rest of the permissions check)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: requesterRoleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role, company_id")
      .eq("user_id", requester.id)
      .single();

    let requesterRole = requesterRoleData?.role;
    let requesterCompanyId = requesterRoleData?.company_id;

    // Fallback for company owners
    if (!requesterRole || !requesterCompanyId) {
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("user_id", requester.id)
        .single();

      if (companyData) {
        requesterRole = "admin";
        requesterCompanyId = companyData.id;
      }
    }

    if (!requesterCompanyId) {
      throw new Error("Requester company not found");
    }

    // 4. Check Seat Limits (if not inviting a Client)
    if (role !== "client") {
      // Get Company Limit
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from("companies")
        .select("seat_limit")
        .eq("id", requesterCompanyId)
        .single();

      if (companyError) throw new Error("Failed to fetch company limits");

      const limit = companyData?.seat_limit || 5; // Default strict fallback if null

      // Count current paid seats (technician, admin, manager)
      const { count, error: countError } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", requesterCompanyId)
        .in("role", ["technician", "admin", "manager"]);

      if (countError) throw new Error("Failed to count current usage");

      if ((count || 0) >= limit) {
        throw new Error(
          `Seat limit reached (${count}/${limit}). Please upgrade your plan to invite more staff.`,
        );
      }
    }

    if (roleError || !requesterRole) {
      throw new Error("Could not verify requester role");
    }

    if (!["admin", "manager"].includes(requesterRole)) {
      throw new Error("Only Admins and Managers can invite users.");
    }

    // prevent Manager from inviting 'admin'
    if (requesterRole === "manager" && role === "admin") {
      throw new Error("Managers cannot invite Admins.");
    }

    const companyId = requesterCompanyId;
    if (!companyId)
      throw new Error("Requester is not associated with a company.");

    // 4. Invite User via Supabase Auth (Admin API)
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(emailTrimmed, {
        data: {
          full_name: full_name,
          invited_by: requester.id,
          company_id: requesterCompanyId,
          client_id: client_id || null,
        },
        redirectTo: "https://thermoneural.com/dashboard", // Configured for production redirect
      });

    let newUserId;

    if (inviteError) {
      // Handle case where user already exists
      if (
        (inviteError as any).status === 422 &&
        (inviteError as any).code === "email_exists"
      ) {
        console.log(`User ${email} already exists. Fetching ID...`);
        // Fetch existing user ID via RPC helper
        const { data: existingUserId, error: fetchError } =
          await supabaseAdmin.rpc("get_user_id_by_email", {
            email: emailTrimmed,
          });

        if (fetchError || !existingUserId) {
          console.error("Failed to fetch existing user ID:", fetchError);
          throw new Error(
            `User already registered, but failed to retrieve details. Please ask them to provide their User ID.`,
          );
        }
        newUserId = existingUserId;
      } else {
        throw new Error(
          `Auth Invite Error: ${inviteError.message} (Email: [${email}])`,
        );
      }
    } else {
      newUserId = inviteData.user.id;
    }

    // 5. Create/Update entry in public.user_roles
    const { error: dbError } = await supabaseAdmin.from("user_roles").upsert({
      user_id: newUserId,
      role: role,
      company_id: role === "client" ? null : requesterCompanyId,
      client_id: client_id || null,
    });

    if (dbError) throw dbError;

    // 6. Send Email Notification (Shared Logic)
    const emailSubject = `Welcome to the Team!`;
    const emailHtml = `
            <h2>You've been added to the team!</h2>
            <p><strong>Role:</strong> ${role}</p>
            <p>You can now access the company dashboard.</p>
            <a href="https://hvac-r.app/dashboard" style="background: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        `;

    // We don't block on email failure, but we log it
    const emailRes = await sendEmail(emailTrimmed, emailSubject, emailHtml);
    if (!emailRes.ok)
      console.error("Failed to send welcome email:", emailRes.error);

    return new Response(
      JSON.stringify({
        message: `Invitation sent to ${email}`,
        user: newUserId,
        emailStatus: emailRes.ok ? "Sent" : "Failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 so client can parse the error message easily
    });
  }
});
