# Sentinel Journal

## 2026-02-26 - [Missing Security Headers]
**Vulnerability:** The application was missing standard security headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.) on API responses. This could leave users vulnerable to clickjacking, MIME-sniffing, and downgrade attacks.
**Learning:** Even with existing middleware files (`server/middleware/securityHeaders.ts`), they must be explicitly imported and used in the main application entry point (`server/index.ts`) to be effective. Merely having the code in the repo is insufficient.
**Prevention:** Always verify that security middleware is not only implemented but also wired up in the Express app. Use integration tests to assert the presence of these headers.
