import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DocsViewer from "@/components/DocsViewer";
import { Search, FileText } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PublicPageShell } from "@/components/public/PublicPageShell";

const documentation = [
  {
    category: "Getting started",
    articles: [
      {
        title: "Welcome to ThermoNeural",
        description: "Overview of the platform and how to set up your first project.",
        readTime: "3 min read",
      },
      {
        title: "Create your first calculation",
        description: "Step-by-step cycle analysis walkthrough.",
        readTime: "5 min read",
      },
      {
        title: "Team setup",
        description: "Invite users and organize shared projects.",
        readTime: "4 min read",
      },
    ],
  },
  {
    category: "Core workflows",
    articles: [
      {
        title: "Standard cycle analysis",
        description: "Model single-stage systems and export results.",
        readTime: "6 min read",
      },
      {
        title: "Refrigerant comparison",
        description: "Compare performance and GWP across refrigerants.",
        readTime: "5 min read",
      },
      {
        title: "Cascade systems",
        description: "Optimize multi-stage, low-temperature systems.",
        readTime: "7 min read",
      },
    ],
  },
  {
    category: "Compliance",
    articles: [
      {
        title: "Leak rate reporting",
        description: "Track thresholds and build audit-ready reports.",
        readTime: "5 min read",
      },
      {
        title: "Refrigerant inventory",
        description: "Maintain a clear refrigerant bank with exportable logs.",
        readTime: "6 min read",
      },
      {
        title: "Safety guidance",
        description: "Document assumptions and safety notes alongside calculations.",
        readTime: "4 min read",
      },
    ],
  },
];

export function Documentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDocTitle, setActiveDocTitle] = useState<string | null>(null);

  const filtered = documentation
    .map((section) => ({
      ...section,
      articles: section.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((section) => section.articles.length > 0);

  return (
    <PublicPageShell mainClassName="pt-24 pb-20">
        <SEO
          title="Documentation"
          description="ThermoNeural documentation for HVAC&R, refrigeration, and cryogenic engineering workflows."
        />

        <section className="px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Documentation</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold">
              Everything your team needs to get productive quickly.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse workflows, export guides, and compliance references for HVAC&R and cryogenic systems.
            </p>

            <div className="mt-8 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documentation"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setActiveDocTitle(
                    filtered[0]?.articles[0]?.title ??
                      documentation[0]?.articles[0]?.title ??
                      null,
                  )
                }
              >
                Open docs viewer
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4">
          <div className="max-w-5xl mx-auto space-y-10">
            {filtered.map((section) => (
              <div key={section.category}>
                <h2 className="text-2xl font-semibold capitalize">{section.category}</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {section.articles.map((article) => (
                    <Card
                      key={article.title}
                      className="border-border/60 cursor-pointer transition-colors hover:border-primary/50"
                      onClick={() => setActiveDocTitle(article.title)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-4 w-4 text-primary" />
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        <p>{article.description}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{article.readTime}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {activeDocTitle && (
          <DocsViewer
            title={activeDocTitle}
            onClose={() => setActiveDocTitle(null)}
          />
        )}
    </PublicPageShell>
  );
}
