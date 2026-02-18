
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { generateEmailHtml } from "../_shared/email-template.ts";
import { sendSms } from "../_shared/sms-sender.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { record } = payload;

        // 0. Handle Telnyx Webhook (Inbound)
        if (payload.data && payload.data.event_type) {
            console.log(`[Telnyx Webhook] Event: ${payload.data.event_type}`);
            return new Response(JSON.stringify({ received: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // Validation (Standard Workflows)
        if (!record || !record.workflow_type) {
            console.log("Invalid Payload (No workflow_type):", JSON.stringify(payload));
            return new Response("Invalid Payload", { status: 400 });
        }

        const workflowType = record.workflow_type;
        const inputPayload = record.input_payload;
        const recordId = record.id;
        const userId = record.user_id;

        console.log(`[Dispatcher] Processing: ${workflowType} (ID: ${recordId})`);

        // Init Supabase Admin (Service Role) to update status
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        let resultStub = { success: false, message: "Unknown Type" };

        // Fetch Company Name for User & Automation Config
        let companyName = "HVAC Service";
        let automationConfig: any = null;

        if (userId) {
            const { data: companyData } = await supabase
                .from('companies')
                .select('name, alert_config')
                .eq('user_id', userId)
                .single();

            if (companyData) {
                if (companyData.name) {
                    companyName = companyData.name;
                }
                if (companyData.alert_config) {
                    automationConfig = companyData.alert_config;
                }
            }
        }

        // Helper to check automation settings
        const shouldSend = (channel: 'sms' | 'email', workflow: string) => {
            if (!automationConfig) return true; // Default to allow

            // 1. Global Check
            const globalKey = channel === 'sms' ? 'sms_enabled' : 'email_enabled';
            if (automationConfig[globalKey] === false) {
                console.log(`[Validation] Skipped ${workflow} (${channel}) - Global Disabled`);
                return false;
            }

            // 2. Workflow Check
            if (automationConfig.workflows && automationConfig.workflows[workflow]) {
                if (automationConfig.workflows[workflow][channel] === false) {
                    console.log(`[Validation] Skipped ${workflow} (${channel}) - Workflow Disabled`);
                    return false;
                }
            }
            return true;
        };

        // ---------------------------------------------------------
        // ROUTING LOGIC
        // ---------------------------------------------------------

        // 1. Review Hunter -> Calls specialized function
        if (workflowType === 'review_hunter') {
            console.log("Routing to internal 'review-hunter' function...");
            // Pass the automationConfig to review-hunter to avoid double fetch? 
            // Valid option, but review-hunter looks up by job_id. Let's let it handle its own lookup or pass it if we trust this userId.
            const { data, error } = await supabase.functions.invoke('review-hunter', {
                body: { ...inputPayload, _automation_config: automationConfig } // Pass it just in case we update RH to use it
            });
            if (error) throw error;
            resultStub = data;

            // 2. Client Invite -> Check Client Preferences First
        } else if (workflowType === 'client_invite') {
            const { email, client_id, integration_id, phone, force_send } = inputPayload;
            const inviteUrl = `https://hvac-r.app/login?invite=${integration_id}`;
            const WORKFLOW_NAME = 'client_invite';

            // Fetch client notification preferences
            let clientPrefs = { sms_enabled: true, email_enabled: true }; // Default
            if (client_id && !force_send) {
                const { data: clientData } = await supabase
                    .from('clients')
                    .select('notification_preferences')
                    .eq('id', client_id)
                    .single();

                if (clientData?.notification_preferences) {
                    clientPrefs = clientData.notification_preferences;
                }
            }

            // Email Logic - check client preference + company config
            if (email && (force_send || clientPrefs.email_enabled) && shouldSend('email', WORKFLOW_NAME)) {
                await sendResendEmail({
                    to: email,
                    subject: "You've been invited to the Client Portal",
                    html: generateEmailHtml({
                        companyName: companyName,
                        headline: "Welcome to your Client Portal",
                        firstParagraph: `You have been invited by <strong>${companyName}</strong> to track your HVAC jobs, invoices, and service history.`,
                        cta: {
                            text: "Access Portal",
                            url: inviteUrl
                        },
                        footerText: "Powered by Thermoneural"
                    })
                });
            } else if (email && !force_send && !clientPrefs.email_enabled) {
                console.log(`[Client Preference] Skipped ${WORKFLOW_NAME} email - Client opted out`);
            }

            // SMS Logic - check client preference + company config
            if (phone && (force_send || clientPrefs.sms_enabled) && shouldSend('sms', WORKFLOW_NAME)) {
                await sendSms({
                    to: phone,
                    text: `Hi from ${companyName}! Tap here to access your Client Portal: ${inviteUrl} . Powered by Thermoneural`
                });
            } else if (phone && !force_send && !clientPrefs.sms_enabled) {
                console.log(`[Client Preference] Skipped ${WORKFLOW_NAME} sms - Client opted out`);
            }

            resultStub = { success: true, message: "Invite Processed" };

            // 3. System Alert (Legacy: whatsapp_alert) -> Direct Email + SMS
        } else if (workflowType === 'whatsapp_alert' || workflowType === 'system_alert') {
            const { message, reading_value, phone } = inputPayload;
            const WORKFLOW_NAME = 'system_alert';

            // Get user email (owner)
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            const ownerEmail = userData?.user?.email;

            if (ownerEmail) {
                if (shouldSend('email', WORKFLOW_NAME)) {
                    await sendResendEmail({
                        to: ownerEmail,
                        subject: `⚠️ Alert: High Temperature Detected`,
                        html: generateEmailHtml({
                            companyName: "Thermoneural Monitoring",
                            headline: "System Alert Triggered",
                            firstParagraph: `<strong>Message:</strong> ${message}`,
                            infoBox: {
                                label: "Sensor Reading",
                                value: reading_value
                            },
                            cta: {
                                text: "View Dashboard",
                                url: "https://hvac-r.app/mission-control"
                            }
                        })
                    });
                }

                // SMS Logic (To the owner provided phone in payload, or fallback)
                if (phone && shouldSend('sms', WORKFLOW_NAME)) {
                    await sendSms({
                        to: phone,
                        text: `⚠️ ALERT: ${message}. Value: ${reading_value}. - Thermoneural`
                    });
                }

                resultStub = { success: true, message: "Alert Processed" };
            } else {
                resultStub = { success: false, message: "Owner Email Not Found" };
            }

            // 4. Job Scheduled -> Check Client Preferences
        } else if (workflowType === 'job_scheduled') {
            const { client_email, client_phone, client_id, start_time, title, force_send } = inputPayload;
            const WORKFLOW_NAME = 'job_scheduled';

            // Fetch client notification preferences
            let clientPrefs = { sms_enabled: true, email_enabled: true }; // Default
            let clientIdToUse = client_id;

            // If no client_id provided, try to lookup by email
            if (!clientIdToUse && client_email) {
                const { data: clientData } = await supabase
                    .from('clients')
                    .select('id, notification_preferences')
                    .eq('contact_email', client_email)
                    .single();

                if (clientData) {
                    clientIdToUse = clientData.id;
                    if (clientData.notification_preferences) {
                        clientPrefs = clientData.notification_preferences;
                    }
                }
            } else if (clientIdToUse && !force_send) {
                const { data: clientData } = await supabase
                    .from('clients')
                    .select('notification_preferences')
                    .eq('id', clientIdToUse)
                    .single();

                if (clientData?.notification_preferences) {
                    clientPrefs = clientData.notification_preferences;
                }
            }

            // Fetch Technician Name if ID provided
            let techName = '';
            if (inputPayload.technician_id) {
                const { data: techUser } = await supabase.auth.admin.getUserById(inputPayload.technician_id);
                if (techUser && techUser.user) {
                    techName = techUser.user.user_metadata?.full_name || 'a Technician';
                }
            }

            // Email Logic
            if (client_email && (force_send || clientPrefs.email_enabled) && shouldSend('email', WORKFLOW_NAME)) {
                await sendResendEmail({
                    to: client_email,
                    subject: `Job Confirmed: ${title}`,
                    html: generateEmailHtml({
                        companyName: companyName,
                        headline: "Appointment Confirmed",
                        firstParagraph: `We have confirmed your appointment for <strong>${title}</strong>.${techName ? ` <br>Your technician will be <strong>${techName}</strong>.` : ''}`,
                        infoBox: {
                            label: "Scheduled Time",
                            value: new Date(start_time).toLocaleString()
                        },
                        cta: {
                            text: "View Appointment",
                            url: "https://hvac-r.app/portal"
                        },
                        footerText: "Powered by Thermoneural"
                    })
                });
            } else if (client_email && !force_send && !clientPrefs.email_enabled) {
                console.log(`[Client Preference] Skipped ${WORKFLOW_NAME} email - Client opted out`);
            }

            // SMS Logic
            if (client_phone && (force_send || clientPrefs.sms_enabled) && shouldSend('sms', WORKFLOW_NAME)) {
                const techText = techName ? ` with ${techName}` : '';
                await sendSms({
                    to: client_phone,
                    text: `Appointment Confirmed: ${title}${techText} on ${new Date(start_time).toLocaleString()}. Powered by Thermoneural. Reply STOP to opt out.`
                });
            } else if (client_phone && !force_send && !clientPrefs.sms_enabled) {
                console.log(`[Client Preference] Skipped ${WORKFLOW_NAME} sms - Client opted out`);
            }

            resultStub = { success: true, message: "Scheduling Notification Sent" };

        } else {
            console.warn(`Unknown Workflow Type: ${workflowType}`);
            return new Response(`Unknown Type: ${workflowType}`, { status: 400 });
        }

        // ---------------------------------------------------------
        // UPDATE STATUS
        // ---------------------------------------------------------
        await supabase
            .from('workflow_requests')
            .update({
                status: 'completed',
                output_payload: resultStub,
                updated_at: new Date().toISOString()
            })
            .eq('id', recordId);

        return new Response(JSON.stringify(resultStub), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err) {
        console.error("Dispatcher Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

// Helper Function
async function sendResendEmail({ to, subject, html }) {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
        return;
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'notifications@thermoneural.com', // Verified Domain
            to: to,
            subject: subject,
            html: html
        })
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Resend API Error: ${txt}`);
    }
    console.log(`[Email Sent] To: ${to}`);
}
