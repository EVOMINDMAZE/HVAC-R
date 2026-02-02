#!/bin/bash

# Configuration
# Ideally, we would fetch a real User ID from the DB, but since we are mocking, 
# you should replace `YOUR_USER_ID_HERE` with a valid UUID from your `auth.users` table
# or the script will try to create a company for a non-existent user (which might fail FK constraints if configured strict, 
# but usually auth.users is distinct from public tables unless referencing public.users which links to auth).
# In this schema, `companies.user_id` likely references `auth.users`.
# If you don't have a user ID handy, the script might fail at the database level.
# 
# Usage: ./simulate_checkout.sh [USER_UUID]

USER_ID=$1

if [ -z "$USER_ID" ]; then
  echo "Usage: ./simulate_checkout.sh <USER_UUID>"
  echo "Please provide a valid Supabase User UUID to attach the license to."
  exit 1
fi

WEBHOOK_SECRET="whsec_test_secret" # In local dev this is often loosely checked or simulated
# For local supabase functions, the secret check logic in the function might fail if we don't sign it correctly.
# The function uses `stripe.webhooks.constructEventAsync`.
# This VERIFIES the signature. Simulation is hard without the real Stripe lib to sign it.
# 
# ALTERNATIVE: We can bypass signature check in the code temporarily OR use the Stripe CLI.
# Using Stripe CLI is the standard way: `stripe trigger checkout.session.completed`
# But if we want to run a custom curl, we'd need to compute the signature.
#
# Let's try to assume the user might have Stripe CLI installed? 
# If not, modifying the Edge Function to BYPASS signature check for manual testing is easiest.

echo "⚠️ Note: This script assumes you have disabled Stripe Signature verification in local dev,"
echo "OR you are calculating a valid signature. Generating a fake signature..."

# Payload
timestamp=$(date +%s)
payload=$(cat <<EOF
{
  "id": "evt_test_webhook",
  "object": "event",
  "type": "checkout.session.completed",
  "created": $timestamp,
  "data": {
    "object": {
      "id": "cs_test_session",
      "object": "checkout.session",
      "client_reference_id": "$USER_ID",
      "customer": "cus_test_customer",
      "customer_details": {
        "email": "audit_test@thermoneural.com",
        "name": "Audit Test Admin"
      },
      "customer_email": "audit_test@thermoneural.com",
      "payment_status": "paid",
      "status": "complete"
    }
  }
}
EOF
)

# Compute Signature (HMAC SHA256) - Requires openssl
# Key must match Deno.env.get("STRIPE_WEBHOOK_SECRET")
# In local Supabase, this is usually explicitly set in .env or config.
# If unknown, this step fails. 

# PLAN B: Direct Invoke via Supabase functions serve (if bypassing sig).
# But better: use `stripe trigger` if available.
# Since we are automating, let's try to hit the endpoint and look for the error.

curl -i -X POST http://localhost:54321/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=$timestamp,v1=dummy_signature_for_test" \
  -d "$payload"

