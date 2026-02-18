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

// Minimal Markdown to HTML converter for docs (supports headings, lists, code blocks, links, blockquotes, inline code, images, tables)
function mdToHtml(md: string) {
  if (!md) return "";

  // Escape HTML
  let out = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Fenced code blocks with optional language ```lang
  // Code blocks - usually acceptable to keep dark in both modes or ensure dark mode stays readable
  out = out.replace(
    /```\s*([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const escaped = code.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      const langClass = lang ? ` language-${lang}` : "";
      return `<pre class="rounded-md bg-slate-900 text-slate-100 p-4 overflow-auto text-sm mb-6 border border-slate-800"><code class="block code-block${langClass}">${escaped}</code></pre>`;
    },
  );

  // Horizontal rules
  out = out.replace(
    /^(-{3,}|\*{3,})$/gim,
    '<hr class="my-6 border-slate-200 dark:border-slate-700" />',
  );

  // Images
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, (_, alt, src) => {
    return `<figure class="my-6"><img src="${src}" alt="${alt}" class="rounded w-full" /><figcaption class="text-sm text-gray-500 dark:text-gray-400 mt-2">${alt}</figcaption></figure>`;
  });

  // Blockquotes
  out = out.replace(
    /^>\s?(.*$)/gim,
    (_, t) =>
      `<blockquote class="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-200 dark:border-slate-700 pl-4 py-2 rounded mt-4 text-slate-700 dark:text-slate-300">${t}</blockquote>`,
  );

  // Headings
  const headingClasses = (level: number, sizeClass: string) => {
    return `${sizeClass} font-bold mt-4 mb-2 group text-foreground`;
  };

  out = out.replace(
    /^######\s?(.*$)/gim,
    (_, t) =>
      `<h6 id="${slugify(t)}" class="text-sm font-semibold mt-4 mb-2 group text-foreground">${t}<a href="#${slugify(t)}" class="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm opacity-0 group-hover:opacity-100">#</a></h6>`,
  );
  out = out.replace(
    /^#####\s?(.*$)/gim,
    (_, t) =>
      `<h5 id="${slugify(t)}" class="text-sm font-semibold mt-4 mb-2 group text-foreground">${t}<a href="#${slugify(t)}" class="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm opacity-0 group-hover:opacity-100">#</a></h5>`,
  );
  out = out.replace(
    /^####\s?(.*$)/gim,
    (_, t) =>
      `<h4 id="${slugify(t)}" class="text-lg font-semibold mt-6 mb-3 group text-foreground">${t}<a href="#${slugify(t)}" class="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm opacity-0 group-hover:opacity-100">#</a></h4>`,
  );
  out = out.replace(
    /^###\s?(.*$)/gim,
    (_, t) =>
      `<h3 id="${slugify(t)}" class="text-xl font-semibold mt-6 mb-3 group text-foreground">${t}<a href="#${slugify(t)}" class="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm opacity-0 group-hover:opacity-100">#</a></h3>`,
  );
  out = out.replace(
    /^##\s?(.*$)/gim,
    (_, t) =>
      `<h2 id="${slugify(t)}" class="text-2xl font-bold mt-8 mb-4 group text-foreground">${t}<a href="#${slugify(t)}" class="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm opacity-0 group-hover:opacity-100">#</a></h2>`,
  );
  out = out.replace(
    /^#\s?(.*$)/gim,
    (_, t) =>
      `<h1 id="${slugify(t)}" class="text-3xl font-extrabold mt-8 mb-6 group text-foreground">${t}<a href="#${slugify(t)}" class="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm opacity-0 group-hover:opacity-100">#</a></h1>`,
  );

  // Tables
  out = out.replace(
    /(^\|.+\|\n\|[-: |]+\|\n([\s\S]*?\n)*?)(?=\n|$)/gm,
    (m) => {
      const lines = m.trim().split("\n").filter(Boolean);
      if (lines.length < 2) return m;
      const header = lines[0]
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((s) => s.trim());
      const rows = lines.slice(2).map((l) =>
        l
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((s) => s.trim()),
      );
      const thead = `<thead class="bg-slate-50 dark:bg-slate-800 text-left text-foreground"><tr>${header.map((h) => `<th class="px-3 py-2 font-semibold">${h}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td class="px-3 py-2 border-t border-slate-200 dark:border-slate-700 text-foreground">${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
      return `<div class="overflow-auto my-4"><table class="min-w-full border-collapse text-sm">${thead}${tbody}</table></div>`;
    },
  );

  // Inline code
  out = out.replace(
    /`([^`]+)`/gim,
    '<code class="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-sm text-rose-600 dark:text-rose-400">$1</code>',
  );

  // Bold and italic
  out = out.replace(
    /\*\*(.*?)\*\*/gim,
    '<strong class="font-bold text-foreground">$1</strong>',
  );
  out = out.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

  // Links
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/gim,
    '<a class="text-orange-600 dark:text-orange-400 underline" href="$2" target="_blank" rel="noreferrer">$1</a>',
  );

  // List replacements remain mostly the same structure but semantic classes
  out = out.replace(
    /(^|\n)\d+\.\s+(.*)/gim,
    '$1<li class="text-foreground">$2</li>',
  );
  out = out.replace(/(<li>[\s\S]*?<\/li>)/gim, (m) => {
    return `<ol class="list-decimal ml-6 mt-2 marker:text-muted-foreground">${m}</ol>`;
  });

  out = out.replace(
    /(^|\n)-\s+(.*)/gim,
    '$1<li class="text-foreground">$2</li>',
  );
  out = out.replace(/(<li>[\s\S]*?<\/li>)/gim, (m) => {
    return `<ul class="list-disc list-inside ml-6 mt-2 marker:text-muted-foreground">${m}</ul>`;
  });

  // Paragraphs
  out = out.replace(/\n{2,}/g, "\n\n");
  const paragraphs = out
    .split(/\n\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  out = paragraphs
    .map((p) => {
      if (
        p.startsWith("<h") ||
        p.startsWith("<ul") ||
        p.startsWith("<pre") ||
        p.startsWith("<ol") ||
        p.startsWith("<blockquote")
      )
        return p;
      return `<p class="text-gray-700 dark:text-slate-300 mt-4 leading-relaxed text-base">${p.replace(/\n/g, "<br />")}</p>`;
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
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
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
          const isHtml =
            /^\s*<(?:!doctype|html)/i.test(text) ||
            (res.headers.get("content-type") || "").includes("text/html");
          return { ok: true, text, htmlLike: isHtml };
        };

        // Known mapping from article titles to doc filenames
        const titleToFile: Record<string, string> = {
          "Quick Start Guide": "quick-start.md",
          "Account Setup": "account-setup.md",
          "First Calculation": "first-calculation.md",
          "Understanding Results": "understanding-results.md",
          "Basic Cycle Theory": "standard-cycle.md",
          "Input Parameters": "standard-cycle.md",
          "Performance Metrics": "standard-cycle.md",
          "Comparison Methodology": "refrigerant-comparison.md",
          "Environmental Impact": "refrigerant-comparison.md",
          "Performance Analysis": "refrigerant-comparison.md",
          "Best Practices": "refrigerant-comparison.md",
          "Cascade Theory": "cascade-systems.md",
          "System Design": "cascade-systems.md",
          Optimization: "cascade-systems.md",
          "Cascade Troubleshooting": "cascade-systems.md",

          "Custom Properties": "advanced-topics.md",
          "Batch Processing": "advanced-topics.md",
          "Data Export": "advanced-topics.md",
          "Data Integration": "advanced-topics.md",
          "Getting Started": "getting-started.md",
          FAQs: "faqs.md",
          Troubleshooting: "troubleshooting.md",
          Contributing: "contributing.md",
          Architecture: "architecture.md",
          "Release Notes": "release-notes.md",
          License: "license.md",

          // New article mappings (Getting Started category)
          "Welcome to ThermoNeural": "welcome.md",
          "Creating Your First Calculation": "first-calculation.md",
          "Understanding Your Dashboard": "dashboard-guide.md",

          // New article mappings (Field Tools category)
          "Superheat & Subcooling Calculator": "superheat-subcooling.md",
          "A2L Leak Detection Guide": "a2l-guide.md",
          "Psychrometric Calculations": "psychrometric.md",

          // New article mappings (HVAC Reference category)
          "Refrigerant Properties": "refrigerant-properties.md",
          "PT Chart Reference": "pt-chart.md",
          "System Troubleshooting": "troubleshooting.md",
        };

        const baseSlug = slugify(title || "");
        const candidates = new Set<string>();

        // prefer explicit mapping if available
        if (title && titleToFile[title]) {
          const fname = titleToFile[title];
          candidates.add(fname.replace(/\.md$/, ""));
        }

        candidates.add(baseSlug);

        if (baseSlug.endsWith("-guide"))
          candidates.add(baseSlug.replace(/-guide$/, ""));
        candidates.add(baseSlug.replace(/-[^-]+$/, ""));
        const firstTwo = (title || "")
          .toLowerCase()
          .split(/\s+/)
          .slice(0, 2)
          .join("-")
          .replace(/[^a-z0-9-]/g, "");
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
          const nodes = Array.from(
            doc.querySelectorAll("h1, h2, h3, h4, h5, h6"),
          );
          const hs = nodes.map((n) => {
            // prefer the first text node so trailing anchor text (e.g. '#') isn't included
            const firstText =
              n.childNodes && n.childNodes.length && n.childNodes[0].textContent
                ? String(n.childNodes[0].textContent).trim()
                : (n.textContent || "").trim();
            const cleanText = firstText.replace(/\s*#\s*$/g, "");
            return {
              id: n.id || slugify(cleanText),
              text: cleanText,
              level: Number(n.tagName.replace("H", "")),
            };
          });
          setHeadings(hs);
        } catch (e) {
          setHeadings([]);
        }
      } catch (err: any) {
        console.error("Failed to load doc:", err);
        setContent(
          `<p class="text-red-600">Document not found: ${title}</p>`,
        );
        setHeadings([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [title]);

  if (!title) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-6">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-lg shadow-xl overflow-hidden max-h-[90vh] grid grid-cols-1 lg:grid-cols-4 border border-slate-200 dark:border-slate-800">
        <div
          className="col-span-1 lg:col-span-3 overflow-auto"
          style={{ maxHeight: "90vh" }}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div
            ref={contentRef}
            className="p-6 prose prose-slate dark:prose-invert prose-lg max-w-none overflow-auto prose-a:text-orange-600 dark:prose-a:text-orange-400 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-800/50 prose-pre:bg-slate-900"
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mr-4"></div>
                <div className="text-gray-700 dark:text-gray-300">
                  Loading article…
                </div>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: content || "" }} />
            )}
          </div>
        </div>

        <aside
          className="hidden lg:block col-span-1 border-l border-slate-200 dark:border-slate-800 p-4 overflow-auto bg-slate-50/50 dark:bg-slate-900/50"
          style={{ maxHeight: "90vh" }}
        >
          <h4 className="text-sm font-semibold mb-2 text-foreground">
            On this page
          </h4>
          <nav className="space-y-1 text-sm">
            {headings.map((h) => (
              <button
                key={h.id}
                className={`w-full text-left truncate hover:text-orange-600 dark:hover:text-orange-400 py-1 text-sm transition-colors ${h.level > 2 ? "pl-4 text-muted-foreground" : "font-medium text-foreground"}`}
                onClick={() => {
                  const el = contentRef.current?.querySelector(`#${h.id}`);
                  if (el)
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
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
