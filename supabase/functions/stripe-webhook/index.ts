import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
        return new Response("Missing signature or secret", { status: 400 });
    }

    let event;
    try {
        const body = await req.text();
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
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
                const subscriptionId = session.subscription;
                const customerId = session.customer;

                if (userId && subscriptionId) {
                    await supabase.from("subscriptions").upsert({
                        user_id: userId,
                        stripe_subscription_id: subscriptionId,
                        stripe_customer_id: customerId,
                        status: "active",
                        price_id: session.metadata?.price_id, // Ensure you pass this in metadata
                    });
                }
                break;
            }
            case "customer.subscription.updated": {
                const subscription = event.data.object;
                await supabase
                    .from("subscriptions")
                    .update({
                        status: subscription.status,
                        price_id: subscription.items.data[0].price.id,
                    })
                    .eq("stripe_subscription_id", subscription.id);
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                await supabase
                    .from("subscriptions")
                    .update({ status: "canceled" })
                    .eq("stripe_subscription_id", subscription.id);
                break;
            }
        }
    } catch (error) {
        console.error(`Error processing webhook: ${error.message}`);
        return new Response("Internal Server Error", { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});
