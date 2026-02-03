## 2025-05-02 - Hardcoded Secrets & Unsafe HTML Rendering
**Vulnerability:** Found hardcoded fallback secrets in `server/utils/auth.ts` (`JWT_SECRET`) and `server/utils/stripe.ts` (implied). Also found widespread use of `dangerouslySetInnerHTML` for external data (RSS feeds in `Podcasts.tsx`, Markdown in `DocsViewer.tsx`).
**Learning:** The application relies on `process.env` but provides insecure defaults that could lead to full compromise if environment variables are missing. Frontend components assume sanitized input but use regex stripping which is insufficient.
**Prevention:** Enforce environment variable presence at startup (fail fast). Use a proper sanitization library (DOMPurify) instead of `dangerouslySetInnerHTML` or regex-based stripping.
