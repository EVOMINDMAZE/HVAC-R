import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // Get user from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;

    // Route to different billing operations
    if (path.endsWith("/create-checkout-session") && req.method === "POST") {
      return await createCheckoutSession(req, user);
    } else if (
      path.endsWith("/create-portal-session") &&
      req.method === "POST"
    ) {
      return await createPortalSession(req, user);
    } else if (path.endsWith("/subscription") && req.method === "GET") {
      return await getSubscription(req, user);
    } else if (path.endsWith("/webhook") && req.method === "POST") {
      return await handleWebhook(req);
    } else if (path.endsWith("/test") && req.method === "GET") {
      return new Response(
        JSON.stringify({ message: "Billing functions are working!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Billing function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function createCheckoutSession(req: Request, user: any) {
  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Price ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if Stripe is configured
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({
          error: "Payment processing not configured. Please contact support.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${Deno.env.get("CLIENT_URL") || "https://173ba54839db44079504686aa5642124-7d4f8c681adb406aa7578b14f.fly.dev"}/profile?success=true`,
      cancel_url: `${Deno.env.get("CLIENT_URL") || "https://173ba54839db44079504686aa5642124-7d4f8c681adb406aa7578b14f.fly.dev"}/pricing`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function createPortalSession(req: Request, user: any) {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({
          error: "Payment processing not configured. Please contact support.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    });

    // Find customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No Stripe customer found. Please make a purchase first.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const customerId = customers.data[0].id;
    const returnUrl = `${Deno.env.get("CLIENT_URL") || "https://173ba54839db44079504686aa5642124-7d4f8c681adb406aa7578b14f.fly.dev"}/profile`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create portal session" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function getSubscription(req: Request, user: any) {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({
          subscription: null,
          plan: "free",
          status: "active",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    });

    // Find customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({
          subscription: null,
          plan: "free",
          status: "active",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const subscription = subscriptions.data[0] || null;

    if (!subscription) {
      return new Response(
        JSON.stringify({
          subscription: null,
          plan: "free",
          status: "active",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Extract plan info from subscription
    const priceId = subscription.items.data[0]?.price.id;
    let planName = "free";

    // Map price IDs to plan names
    const priceIdToPlan: { [key: string]: string } = {
      [Deno.env.get("VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID") || ""]:
        "professional",
      [Deno.env.get("VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID") || ""]:
        "professional_yearly",
      [Deno.env.get("VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID") || ""]:
        "enterprise",
      [Deno.env.get("VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID") || ""]:
        "enterprise_yearly",
    };

    if (priceId && priceIdToPlan[priceId]) {
      planName = priceIdToPlan[priceId];
    }

    return new Response(
      JSON.stringify({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          plan: planName,
          amount: subscription.items.data[0]?.price.unit_amount / 100,
          currency: subscription.items.data[0]?.price.currency,
          interval: subscription.items.data[0]?.price.recurring?.interval,
        },
        plan: planName,
        status: subscription.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch subscription" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleWebhook(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return new Response("Webhook secret not configured", { status: 400 });
    }

    if (!sig) {
      return new Response("Missing stripe signature", { status: 400 });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response("Stripe not configured", { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    });

    const body = await req.arrayBuffer();

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Checkout session completed:", event.data.object.id);
        break;

      case "customer.subscription.updated":
        console.log("Subscription updated:", event.data.object.id);
        break;

      case "customer.subscription.deleted":
        console.log("Subscription deleted:", event.data.object.id);
        break;

      case "invoice.payment_succeeded":
        console.log("Payment succeeded for invoice:", event.data.object.id);
        break;

      case "invoice.payment_failed":
        console.log("Payment failed for invoice:", event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
