## 2025-02-18 - Hardcoded API Key in Scripts
**Vulnerability:** A hardcoded Render API key was found in `scripts/manage-render.js`.
**Learning:** Developers sometimes hardcode secrets in scripts intended for local use or automation, forgetting that these files are part of the repository and can leak credentials.
**Prevention:** Always use `process.env` for sensitive data, even in local scripts. Implement pre-commit hooks or scanning tools to detect high-entropy strings or known key formats.
