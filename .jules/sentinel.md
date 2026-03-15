## 2024-03-15 - Unsanitized Markdown Render (XSS Risk)
**Vulnerability:** `client/components/DocsViewer.tsx` passed parsed markdown HTML directly into `dangerouslySetInnerHTML` without proper sanitization, exposing the component to Cross-Site Scripting (XSS) if malicious markdown is provided.
**Learning:** Developers mistakenly trust markdown parsers to output safe HTML, but raw parsers often leave `<script>` tags or malicious event handlers intact unless explicitly stripped.
**Prevention:** Always pipe raw HTML strings through a dedicated sanitization library like `DOMPurify.sanitize()` before passing them to React's `dangerouslySetInnerHTML`, even if the source is considered standard markdown.
