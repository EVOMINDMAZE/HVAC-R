# Troubleshooting

Common issues and how to resolve them.

## 404 on Privacy/Terms
- Ensure routes /privacy and /terms exist in the frontend router.

## Pricing or Billing Failures
- Verify SUPABASE and STRIPE env vars are set.
- Check server logs for Stripe key missing errors.
- Use fallback plans if DB unavailable.

## Calculation Failures
- Check API Service Status card.
- If external calculation service returns HTML or non-JSON, check the service health.
- Validate refrigerant selection and input ranges.

## Auth Errors
- Ensure tokens are present and valid; use debug bypass for local testing.

## Debugging Steps
1. Reproduce the issue locally.
2. Check server logs (server console prints each request).
3. Inspect network tab for API responses and payload shapes.
4. Check Supabase Edge Function logs if used.
