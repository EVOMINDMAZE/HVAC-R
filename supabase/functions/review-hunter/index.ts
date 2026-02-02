import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { generateEmailHtml } from "../_shared/email-template.ts";
import { sendSms } from "../_shared/sms-sender.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        console.log("Review Hunter Triggered!", JSON.stringify(payload));

        const { job_id, client_id, client_email, client_phone, tech_name, force_send } = payload;
        let client_name = payload.client_name; // Make mutable so we can update from DB if needed

        // Init Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Fetch Company Info & Automation Config
        let companyName = "Your HVAC Service"; // Default
        let automationConfig = payload._automation_config || null;

        if (job_id) {
            const { data: jobData } = await supabase
                .from('jobs')
                .select('company_id, companies(name, alert_config)')
                .eq('id', job_id)
                .single();

            if (jobData?.companies) {
                if (jobData.companies.name) {
                    companyName = jobData.companies.name;
                }
                if (jobData.companies.alert_config && !automationConfig) {
                    automationConfig = jobData.companies.alert_config;
                }
            }
        }

        // Helper to check automation settings
        const shouldSend = (channel: 'sms' | 'email') => {
            if (!automationConfig) return true; // Default to allow
            const workflow = 'review_request';

            // 1. Global Check
            const globalKey = channel === 'sms' ? 'sms_enabled' : 'email_enabled';
            if (automationConfig[globalKey] === false) {
                console.log(`[Validation] Skipped Review Request (${channel}) - Global Disabled`);
                return false;
            }

            // 2. Workflow Check
            if (automationConfig.workflows && automationConfig.workflows[workflow]) {
                if (automationConfig.workflows[workflow][channel] === false) {
                    console.log(`[Validation] Skipped Review Request (${channel}) - Workflow Disabled`);
                    return false;
                }
            }
            return true;
        };
        // Fetch Client Notification Preferences
        let clientPrefs = { sms_enabled: true, email_enabled: true }; // Default

        if (client_id && !force_send) {
            const { data: clientData } = await supabase
                .from('clients')
                .select('notification_preferences, name')
                .eq('id', client_id)
                .single();

            if (clientData) {
                if (!client_name && clientData.name) {
                    client_name = clientData.name;
                }
                if (clientData.notification_preferences) {
                    clientPrefs = clientData.notification_preferences;
                }
            }
        }

        // 1. Validation
        if (!client_email && !client_phone) {
            throw new Error("Missing Client Email and Phone");
        }

        const reviewUrl = `https://hvac-r.app/review/${job_id}`;
        let emailStatus = "Skipped (No Email)";

        // 2. Email Logic (Resend) - Check Client Preference AND Company Config
        if (client_email && (force_send || (clientPrefs.email_enabled && shouldSend('email')))) {
            const resendApiKey = Deno.env.get('RESEND_API_KEY');

            if (resendApiKey) {
                console.log(`[Email] Sending review request to ${client_email} via Resend...`);

                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'notifications@thermoneural.com',
                        to: client_email,
                        subject: `How did ${tech_name} do?`,
                        html: generateEmailHtml({
                            companyName: companyName,
                            headline: `How did ${tech_name} do?`,
                            firstParagraph: `Hi ${client_name},`,
                            secondParagraph: `${tech_name} just finished your job. We'd love to hear your feedback to help us improve.`,
                            cta: {
                                text: "Leave a Review",
                                url: reviewUrl
                            }
                        })
                    })
                });

                if (emailResponse.ok) {
                    const resData = await emailResponse.json();
                    emailStatus = `Sent (ID: ${resData.id})`;
                    console.log("[Email] Success", resData);
                } else {
                    const err = await emailResponse.text();
                    console.error("[Email] Failed:", err);
                    emailStatus = `Failed: ${err}`;
                }

            } else {
                console.log(`[Email MOCK] To: ${client_email}`);
                console.log(`[Email MOCK] Subject: How did ${tech_name} do?`);
                console.log(`[Email MOCK] Body: Click here ${reviewUrl}`);
                emailStatus = "Mock Sent (Missing Key)";
            }
        } else if (client_email) {
            if (!clientPrefs.email_enabled) {
                emailStatus = "Skipped (Client Opted Out)";
                console.log(`[Client Preference] Skipped review request email - Client opted out`);
            } else if (!shouldSend('email')) {
                emailStatus = "Skipped (Company Disabled Automation)";
                console.log(`[Company Settings] Skipped review request email - Automation disabled`);
            }
        }

        // 3. SMS Logic (Telnyx) - Check Client Preference AND Company Config
        let smsStatus = "Skipped (No Phone)";
        if (client_phone && (force_send || (clientPrefs.sms_enabled && shouldSend('sms')))) {
            const smsResult = await sendSms({
                to: client_phone,
                text: `Hi ${client_name}, ${tech_name ? tech_name : 'we'} just finished your job. How did we do? ${reviewUrl}`
            });
            smsStatus = smsResult.success ? `Sent (ID: ${smsResult.id})` : `Failed: ${smsResult.error}`;
        } else if (client_phone) {
            if (!clientPrefs.sms_enabled) {
                smsStatus = "Skipped (Client Opted Out)";
                console.log(`[Client Preference] Skipped review request SMS - Client opted out`);
            } else if (!shouldSend('sms')) {
                smsStatus = "Skipped (Company Disabled Automation)";
                console.log(`[Company Settings] Skipped review request SMS - Automation disabled`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            emailStatus: emailStatus,
            smsStatus: smsStatus,
            message: "Review request processing complete"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
