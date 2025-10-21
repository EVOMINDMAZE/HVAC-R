# Troubleshooting

This page lists common issues and how to resolve them.

## 404 on Privacy/Terms
- Ensure routes `/privacy` and `/terms` exist in the frontend router.

## Pricing or Billing Failures
- Verify `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and Stripe environment variables are set in the deployment.

## Calculation Failures
- Check the API service status (service may be down or network blocked).
- Inspect browser console for network or CORS errors.

## Auth Errors
- Ensure authentication tokens exist and are valid. Use the debugging tools in the profile area for local testing.

## Debugging Steps
1. Reproduce the issue and capture network logs.
2. Check backend logs for correlated request IDs.
3. Reach out to support with steps to reproduce and relevant logs.
