## 2026-02-06 - Stripe Webhook Middleware Order
**Vulnerability:** Stripe webhook signature verification failed because the global `express.json()` middleware consumed the request stream before the webhook handler could access the raw body. The handler received a parsed JSON object, causing `stripe.webhooks.constructEvent` to fail.
**Learning:** In Express, global body parsing middleware runs for all routes. For routes requiring raw body access (like webhooks), the raw buffer must be preserved or the middleware must be bypassed.
**Prevention:** Use `verify` option in `express.json()` to store the raw buffer (e.g., `req.rawBody = buf`) globally, allowing downstream handlers to access the raw bytes for signature verification.
