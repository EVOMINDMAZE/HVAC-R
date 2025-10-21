import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Minimal Markdown to HTML converter for docs (supports headings, lists, code blocks, links)
function mdToHtml(md: string) {
  if (!md) return "";

  // Escape HTML
  let out = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks ```
  out = out.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="rounded bg-slate-900 text-slate-100 p-4 overflow-auto"><code>${code.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}</code></pre>`;
  });

  // Headings
  out = out.replace(/^######\s?(.*$)/gim, "<h6 class=\"text-sm font-semibold mt-4\">$1</h6>");
  out = out.replace(/^#####\s?(.*$)/gim, "<h5 class=\"text-sm font-semibold mt-4\">$1</h5>");
  out = out.replace(/^####\s?(.*$)/gim, "<h4 class=\"text-lg font-semibold mt-4\">$1</h4>");
  out = out.replace(/^###\s?(.*$)/gim, "<h3 class=\"text-xl font-semibold mt-4\">$1</h3>");
  out = out.replace(/^##\s?(.*$)/gim, "<h2 class=\"text-2xl font-bold mt-6\">$1</h2>");
  out = out.replace(/^#\s?(.*$)/gim, "<h1 class=\"text-3xl font-bold mt-6\">$1</h1>");

  // Bold and italic
  out = out.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
  out = out.replace(/\*(.*?)\*/gim, "<em>$1</em>");

  // Links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a class="text-blue-600 underline" href="$2" target="_blank" rel="noreferrer">$1</a>');

  // Unordered lists
  // Convert lines starting with - to <li>
  out = out.replace(/(^|\n)-\s+(.*)/gim, "$1<li>$2</li>");
  out = out.replace(/(<li>[\s\S]*?<\/li>)/gim, (m) => {
    // wrap contiguous li blocks in ul
    return `<ul class=\"list-disc list-inside ml-6 mt-2\">${m}</ul>`;
  });

  // Paragraphs - lines separated by blank line
  out = out.replace(/\n{2,}/g, "\n\n");
  const paragraphs = out.split(/\n\n/).map((p) => p.trim()).filter(Boolean);
  out = paragraphs
    .map((p) => {
      if (p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<pre")) return p;
      return `<p class=\"text-gray-700 mt-3 leading-relaxed\">${p.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return out;
}

export function DocsViewer({
  title,
  onClose,
}: {
  title: string | null;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!title) {
      setContent(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const slug = slugify(title || "");
        const path = `/docs/${slug}.md`;

        // Fetch markdown file from public directory
        const response = await fetch(path);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Document not found`);
        }

        const raw = await response.text();
        const html = mdToHtml(raw);
        setContent(html);
      } catch (err: any) {
        console.error("Failed to load doc:", err);
        setContent(`<p class=\"text-red-600\">Document not found: ${title}</p>`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [title]);

  if (!title) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-xl overflow-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6 prose max-w-none">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mr-4"></div>
              <div className="text-gray-700">Loading article…</div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content || "" }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DocsViewer;
