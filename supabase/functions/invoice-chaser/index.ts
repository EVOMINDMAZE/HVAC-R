import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { generateEmailHtml } from "../_shared/email-template.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Find Overdue Invoices
        // status is 'sent', 'unpaid' or 'overdue'
        // due_date is in the past
        // last_reminder_sent_at is null OR > 3 days ago (to avoid spamming)
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

        const { data: invoices, error } = await supabase
            .from('invoices')
            .select(`
                id, total_amount, due_date, status, last_reminder_sent_at,
                companies(name, alert_config),
                clients(id, name, email, notification_preferences)
            `)
            .in('status', ['sent', 'unpaid', 'overdue'])
            .lt('due_date', now.toISOString())
            .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${threeDaysAgo.toISOString()}`);

        if (error) throw error;

        const results = [];

        for (const invoice of invoices || []) {
            const company = invoice.companies;
            const client = invoice.clients;

            // Checks
            if (!company || !client || !client.email) continue;

            // Automation Config Check
            const alertConfig = company.alert_config as any || {};
            // Default to false for invoice chaser if not explicitly enabled? 
            // Or default true? "Business in a Box" usually implies opt-out. 
            // Let's assume opt-out: default true unless specifically false.
            if (alertConfig.invoice_chaser_enabled === false) {
                results.push({ invoiceId: invoice.id, status: 'Skipped (Company Disabled)' });
                continue;
            }

            // Client Preference Check
            const clientPrefs = client.notification_preferences as any || { email_enabled: true };
            if (clientPrefs.email_enabled === false) {
                results.push({ invoiceId: invoice.id, status: 'Skipped (Client Opt-Out)' });
                continue;
            }

            // Send Email
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey) {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'billing@thermoneural.com',
                        to: client.email,
                        subject: `Invoice Overdue: ${company.name}`,
                        html: generateEmailHtml({
                            companyName: company.name,
                            headline: `Invoice Payment Reminder`,
                            firstParagraph: `Hi ${client.name},`,
                            secondParagraph: `This is a friendly reminder that invoice #${invoice.id.slice(0, 8)} for $${invoice.total_amount} was due on ${new Date(invoice.due_date).toLocaleDateString()}.`,
                            cta: {
                                text: "Pay Now",
                                url: `https://hvac-r.app/pay/${invoice.id}`
                            }
                        })
                    })
                });

                if (emailResponse.ok) {
                    // Update last_reminder_sent_at
                    await supabase.from('invoices').update({
                        last_reminder_sent_at: new Date().toISOString(),
                        status: 'overdue' // Auto-mark as overdue
                    }).eq('id', invoice.id);
                    results.push({ invoiceId: invoice.id, status: 'Sent' });
                } else {
                    results.push({ invoiceId: invoice.id, status: 'Failed to Send' });
                }
            } else {
                results.push({ invoiceId: invoice.id, status: 'Mock Sent (No Key)' });
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
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
