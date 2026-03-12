## 2024-05-18 - [Fix XSS Vulnerability in DocsViewer]
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability found in `client/components/DocsViewer.tsx` where user-provided markdown was converted to HTML and rendered directly via `dangerouslySetInnerHTML` without any sanitization.
**Learning:** The application uses React's `dangerouslySetInnerHTML` to render HTML output from markdown without considering the security implications of rendering untrusted content. This allows potential malicious scripts to be executed within the context of the user's browser.
**Prevention:** Always sanitize HTML strings before passing them to `dangerouslySetInnerHTML`. Use established sanitization libraries like `DOMPurify` to clean the HTML and remove potentially harmful scripts.
