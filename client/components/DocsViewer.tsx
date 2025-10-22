import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Minimal Markdown to HTML converter for docs (supports headings, lists, code blocks, links, blockquotes, inline code)
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

  // Blockquotes
  out = out.replace(/^>\s?(.*$)/gim, (_, t) => `<blockquote class=\"border-l-4 border-slate-200 pl-4 italic text-slate-600 mt-4\">${t}</blockquote>`);

  // Headings - add id attributes using slugify and subtle anchor link
  out = out.replace(/^######\s?(.*$)/gim, (_, t) => `<h6 id=\"${slugify(t)}\" class=\"text-sm font-semibold mt-4 group\">${t}<a href=\"#${slugify(t)}\" class=\"ml-2 text-gray-400 hover:text-gray-600 text-sm opacity-0 group-hover:opacity-100\">#</a></h6>`);
  out = out.replace(/^#####\s?(.*$)/gim, (_, t) => `<h5 id=\"${slugify(t)}\" class=\"text-sm font-semibold mt-4 group\">${t}<a href=\"#${slugify(t)}\" class=\"ml-2 text-gray-400 hover:text-gray-600 text-sm opacity-0 group-hover:opacity-100\">#</a></h5>`);
  out = out.replace(/^####\s?(.*$)/gim, (_, t) => `<h4 id=\"${slugify(t)}\" class=\"text-lg font-semibold mt-4 group\">${t}<a href=\"#${slugify(t)}\" class=\"ml-2 text-gray-400 hover:text-gray-600 text-sm opacity-0 group-hover:opacity-100\">#</a></h4>`);
  out = out.replace(/^###\s?(.*$)/gim, (_, t) => `<h3 id=\"${slugify(t)}\" class=\"text-xl font-semibold mt-4 group\">${t}<a href=\"#${slugify(t)}\" class=\"ml-2 text-gray-400 hover:text-gray-600 text-sm opacity-0 group-hover:opacity-100\">#</a></h3>`);
  out = out.replace(/^##\s?(.*$)/gim, (_, t) => `<h2 id=\"${slugify(t)}\" class=\"text-2xl font-bold mt-6 group\">${t}<a href=\"#${slugify(t)}\" class=\"ml-2 text-gray-400 hover:text-gray-600 text-sm opacity-0 group-hover:opacity-100\">#</a></h2>`);
  out = out.replace(/^#\s?(.*$)/gim, (_, t) => `<h1 id=\"${slugify(t)}\" class=\"text-3xl font-bold mt-6 group\">${t}<a href=\"#${slugify(t)}\" class=\"ml-2 text-gray-400 hover:text-gray-600 text-sm opacity-0 group-hover:opacity-100\">#</a></h1>`);

  // Inline code
  out = out.replace(/`([^`]+)`/gim, '<code class=\"rounded bg-slate-100 px-1 py-0.5 text-sm text-rose-600\">$1</code>');

  // Bold and italic
  out = out.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
  out = out.replace(/\*(.*?)\*/gim, "<em>$1</em>");

  // Links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a class=\"text-blue-600 underline\" href="$2" target=\"_blank\" rel=\"noreferrer\">$1</a>');

  // Ordered lists
  out = out.replace(/(^|\n)\d+\.\s+(.*)/gim, "$1<li>$2</li>");
  out = out.replace(/(<li>[\s\S]*?<\/li>)/gim, (m) => {
    // wrap contiguous li blocks in ol if numeric lines were used, otherwise ul will handle - items
    return `<ol class=\"list-decimal ml-6 mt-2\">${m}</ol>`;
  });

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
      if (p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<pre") || p.startsWith("<ol") || p.startsWith("<blockquote")) return p;
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
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!title) {
      setContent(null);
      setHeadings([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const tryFetch = async (slugCandidate: string) => {
          const path = `/docs/${slugCandidate}.md`;
          const res = await fetch(path);
          if (!res.ok) return { ok: false, text: null, htmlLike: false };
          const text = await res.text();
          const isHtml = /^\s*<(?:!doctype|html)/i.test(text) || (res.headers.get("content-type") || "").includes("text/html");
          return { ok: true, text, htmlLike: isHtml };
        };

        const baseSlug = slugify(title || "");
        const candidates = new Set<string>();
        candidates.add(baseSlug);

        if (baseSlug.endsWith("-guide")) candidates.add(baseSlug.replace(/-guide$/, ""));
        candidates.add(baseSlug.replace(/-[^-]+$/, ""));
        const firstTwo = (title || "").toLowerCase().split(/\s+/).slice(0, 2).join("-").replace(/[^a-z0-9-]/g, "");
        if (firstTwo) candidates.add(firstTwo);

        let raw: string | null = null;
        for (const s of candidates) {
          const r = await tryFetch(s);
          if (!r.ok) continue;
          if (r.htmlLike) continue;
          raw = r.text;
          break;
        }

        if (!raw) {
          const final = await tryFetch(baseSlug);
          if (!final.ok || !final.text) throw new Error("Document not found");
          raw = final.text;
        }

        const html = mdToHtml(raw || "");
        setContent(html);

        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const nodes = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"));
          const hs = nodes.map((n) => ({ id: n.id || slugify(n.textContent || ""), text: n.textContent || "", level: Number(n.tagName.replace("H", "")) }));
          setHeadings(hs);
        } catch (e) {
          setHeadings([]);
        }

      } catch (err: any) {
        console.error("Failed to load doc:", err);
        setContent(`<p class=\"text-red-600\">Document not found: ${title}</p>`);
        setHeadings([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [title]);

  if (!title) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl overflow-hidden max-h-[90vh] grid grid-cols-1 lg:grid-cols-4">
        <div className="col-span-1 lg:col-span-3 overflow-auto" style={{ maxHeight: '90vh' }}>
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold">{title}</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div ref={contentRef} className="p-6 prose prose-slate max-w-none overflow-auto">
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

        <aside className="hidden lg:block col-span-1 border-l p-4 overflow-auto" style={{ maxHeight: '90vh' }}>
          <h4 className="text-sm font-semibold mb-2">On this page</h4>
          <nav className="space-y-2 text-sm">
            {headings.map((h) => (
              <button
                key={h.id}
                className={`w-full text-left truncate hover:text-blue-600 ${h.level > 2 ? 'pl-4' : ''}`}
                onClick={() => {
                  const el = contentRef.current?.querySelector(`#${h.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

export default DocsViewer;
