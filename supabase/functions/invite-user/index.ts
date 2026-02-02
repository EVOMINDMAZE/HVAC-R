import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

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

        if (authError || !requester) {
            console.error("Auth Error:", authError);
            throw new Error('Unauthorized');
        }

        // 2. Initial Body Parse
        const body = await req.json();
        const { email, role, full_name, client_id } = body;
        console.log(`Inviting user: email=${email}, role=${role}, full_name=${full_name}, client_id=${client_id}`);
        const emailTrimmed = email.trim();
        if (!emailTrimmed || !role) throw new Error('Email and Role are required');

        if (role === 'client' && !client_id) {
            throw new Error('Client ID is required when inviting a Client user.');
        }

        // 3. Verify Requester Permissions (Admin or Manager) AND Get Company ID
        // ... (rest of the permissions check)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: requesterRole, error: roleError } = await supabaseAdmin
            .from('user_roles')
            .select('role, company_id')
            .eq('user_id', requester.id)
            .single();

        if (roleError || !requesterRole) {
            throw new Error('Could not verify requester role');
        }

        if (!['admin', 'manager'].includes(requesterRole.role)) {
            throw new Error('Only Admins and Managers can invite users.');
        }

        // prevent Manager from inviting 'admin'
        if (requesterRole.role === 'manager' && role === 'admin') {
            throw new Error('Managers cannot invite Admins.');
        }

        const companyId = requesterRole.company_id;
        if (!companyId) throw new Error('Requester is not associated with a company.');


        // 4. Invite User via Supabase Auth (Admin API)
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(emailTrimmed, {
            data: {
                full_name: full_name,
                invited_by: requester.id,
                company_id: companyId,
                client_id: client_id || null
            }
        });

        if (inviteError) {
            throw new Error(`Auth Invite Error: ${inviteError.message} (Email: [${email}])`);
        }
        const newUserId = inviteData.user.id;

        // 5. Create/Update entry in public.user_roles
        const { error: dbError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
                user_id: newUserId,
                role: role,
                company_id: (role === 'client' ? null : companyId),
                client_id: client_id || null,
            });

        if (dbError) throw dbError;

        return new Response(
            JSON.stringify({ message: `Invitation sent to ${email}`, user: inviteData.user }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
