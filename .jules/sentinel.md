## 2025-02-07 - XSS Vulnerability in Markdown Rendering
**Vulnerability:** User-controlled markdown content was converted to HTML and directly injected into the DOM via `dangerouslySetInnerHTML` in `client/components/DocsViewer.tsx` without sanitization.
**Learning:** `dangerouslySetInnerHTML` requires strict sanitization of its input, especially when dealing with content derived from external markdown files or user input, as markdown parsers can allow arbitrary HTML or scripts.
**Prevention:** Always use a security library like `DOMPurify` to sanitize HTML output before passing it to `dangerouslySetInnerHTML`.
