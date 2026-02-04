
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );

        // 1. Authenticate Requesting User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('No Authorization header');
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !requester) throw new Error('Unauthorized');

        // 2. Parse Request
        const { userId, newRole } = await req.json();
        if (!userId || !newRole) throw new Error('Missing userId or newRole');

        // 3. Admin Check (Only Admins can change roles)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verify requester is an ADMIN for their company
        const { data: requesterRoleData } = await supabaseAdmin
            .from('user_roles')
            .select('role, company_id')
            .eq('user_id', requester.id)
            .single();

        // Also check companies table in case they are Owner
        let isAdmin = requesterRoleData?.role === 'admin';
        const companyId = requesterRoleData?.company_id;

        if (!isAdmin) {
            const { data: companyData } = await supabaseAdmin
                .from('companies')
                .select('id')
                .eq('user_id', requester.id)
                .single();
            if (companyData) {
                isAdmin = true;
            }
        }

        if (!isAdmin) throw new Error('Only Admins can update roles.');

        // 4. Update Role in DB
        const { error: updateError } = await supabaseAdmin
            .from('user_roles')
            .update({ role: newRole })
            .eq('user_id', userId)
            .eq('company_id', companyId); // Scoped to company

        if (updateError) throw updateError;

        // 5. Fetch Target User Email for Notification
        const { data: targetUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (targetUser && targetUser.user && targetUser.user.email) {
            const subject = `Your Role Updated to ${newRole}`;
            const html = `
                <h2>Role Update Notification</h2>
                <p>Your role has been updated to <strong>${newRole}</strong>.</p>
                <p>Please log out and log back in to see the changes take effect.</p>
             `;
            await sendEmail(targetUser.user.email, subject, html);
        }

        return new Response(
            JSON.stringify({ message: 'Role updated successfully', newRole }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
