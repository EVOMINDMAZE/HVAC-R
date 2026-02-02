
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { generateEmailHtml } from "../_shared/email-template.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    const body = await req.text();
    let event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
            undefined,
            cryptoProvider
        );
    } catch (err) {
        return new Response(err.message, { status: 400 });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const userId = session.client_reference_id;
                const customerEmail = session.customer_details?.email || session.customer_email;
                const stripeCustomerId = session.customer;
                const customerName = session.customer_details?.name || "Valued Customer";

                console.log(`[Stripe] Checkout Completed for User: ${userId} (${customerEmail})`);

                if (!userId) {
                    console.error("[Stripe] Missing client_reference_id (User ID). Cannot provision.");
                    break;
                }

                // 1. Provision Company (if not exists)
                // We assume 1 User = 1 Company for now (or find existing)
                const { data: existingCompany } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                let companyId = existingCompany?.id;

                if (!companyId) {
                    console.log(`[Stripe] Creating new company for User ${userId}...`);
                    const { data: newCompany, error: companyError } = await supabase
                        .from('companies')
                        .insert({
                            user_id: userId,
                            name: `${customerName}'s Company`, // Placeholder name
                            stripe_customer_id: stripeCustomerId,
                            alert_config: { // Default Automation Settings
                                message: "Job {{id}} has been marked as complete.",
                                invoice_chaser_enabled: true,
                                review_hunter_enabled: true
                            }
                        })
                        .select()
                        .single();

                    if (companyError) {
                        console.error("[Stripe] Company Creation Failed:", companyError);
                        break;
                    }
                    companyId = newCompany.id;
                }

                // 2. Provision License
                const licenseKey = crypto.randomUUID().toUpperCase().replace(/-/g, '').slice(0, 16); // Simple key

                const { error: licenseError } = await supabase
                    .from('licenses')
                    .insert({
                        user_id: userId,
                        key: licenseKey,
                        status: 'active',
                        plan_tier: 'pro', // Default to Pro
                        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 Year
                    });

                if (licenseError) {
                    console.error("[Stripe] License Creation Failed:", licenseError);
                } else {
                    console.log(`[Stripe] License Provisioned: ${licenseKey}`);

                    // 3. Send Welcome Email
                    await sendResendEmail({
                        to: customerEmail,
                        subject: "Welcome to ThermoNeural Pro! 🚀",
                        html: generateEmailHtml({
                            companyName: "ThermoNeural",
                            headline: "You're In!",
                            firstParagraph: "Your account has been upgraded to Pro. You now have access to all commercial features.",
                            infoBox: {
                                label: "License Key",
                                value: licenseKey
                            },
                            cta: {
                                text: "Go to Dashboard",
                                url: "https://hvac-r.app/dashboard"
                            }
                        })
                    });
                }
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object;
                const customerEmail = invoice.customer_email;
                const amount = invoice.amount_paid / 100;
                const currency = invoice.currency.toUpperCase();

                console.log(`[Stripe] Payment Succeeded: ${invoice.id} (${amount} ${currency})`);

                if (customerEmail) {
                    await sendResendEmail({
                        to: customerEmail,
                        subject: `Receipt for your payment (${amount} ${currency})`,
                        html: generateEmailHtml({
                            companyName: "Thermoneural",
                            headline: "Payment Received",
                            firstParagraph: `Thank you for your payment of <strong>${amount} ${currency}</strong>.`,
                            infoBox: {
                                label: "Invoice ID",
                                value: invoice.id
                            },
                            cta: {
                                text: "View Invoice",
                                url: invoice.hosted_invoice_url
                            }
                        })
                    });
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object;
                const customerEmail = invoice.customer_email;
                console.log(`[Stripe] Payment Failed: ${invoice.id}`);

                if (customerEmail) {
                    await sendResendEmail({
                        to: customerEmail,
                        subject: `Action Required: Payment Failed`,
                        html: generateEmailHtml({
                            companyName: "Thermoneural",
                            headline: "Payment Failed",
                            firstParagraph: "We were unable to process your payment.",
                            cta: {
                                text: "Update Payment Method",
                                url: invoice.hosted_invoice_url
                            }
                        })
                    });
                }
                break;
            }

            // ... keep existing cases ...
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        return new Response(error.message, { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});


// Helper Function (Duplicated until shared module logic is established)
async function sendResendEmail({ to, subject, html }) {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
        return;
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'notifications@thermoneural.com',
                to: to,
                subject: subject,
                html: html
            })
        });

        if (!res.ok) {
            console.error("Resend Error:", await res.text());
        } else {
            console.log(`[Email Sent] To: ${to}`);
        }
    } catch (e) {
        console.error("Email Fetch Error:", e);
    }
}
