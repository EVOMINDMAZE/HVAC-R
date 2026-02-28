## 2024-03-01 - [Enforced Fail-Secure Policy for JWT Secrets in Production]
**Vulnerability:** The application previously fell back to warning logs and default secrets when `JWT_SECRET` was missing in production, allowing potentially insecure authentication.
**Learning:** The `authenticateSupabaseToken` middleware allowed the application to continue verifying tokens even with default insecure secrets, violating the fail-secure principle.
**Prevention:** Ensured the middleware actively blocks requests with a 500 status code and non-leaking error messages in `NODE_ENV === "production"` when JWT secrets are missing or match defaults.
