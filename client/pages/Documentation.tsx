import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import DocsViewer from "@/components/DocsViewer";
import {
  Search,
  PlayCircle,
  Users,
  ChevronRight,
  Download,
  FileText,
  Rocket,
  Calculator,
  Thermometer,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/PageContainer";

const documentation: {
  category: string;
  icon: any;
  colorClass: string;
  gradientClass: string;
  articles: {
    title: string;
    description: string;
    readTime: string;
  }[];
}[] = [
  {
    category: "Getting Started",
    icon: Rocket,
    colorClass: "text-orange-600 dark:text-orange-400",
    gradientClass: "from-orange-500/10 to-transparent",
    articles: [
      {
        title: "Welcome to ThermoNeural",
        description:
          "Get started with our HVAC-R calculation platform. Learn basic navigation and key features.",
        readTime: "3 min read",
      },
      {
        title: "Creating Your First Calculation",
        description:
          "Step-by-step guide to performing your first HVAC calculation using our Field Tools.",
        readTime: "5 min read",
      },
      {
        title: "Understanding Your Dashboard",
        description:
          "Navigate the dashboard, view history, and manage your saved calculations.",
        readTime: "4 min read",
      },
    ],
  },
  {
    category: "Field Tools",
    icon: Calculator,
    colorClass: "text-green-600 dark:text-green-400",
    gradientClass: "from-green-500/10 to-transparent",
    articles: [
      {
        title: "Superheat & Subcooling Calculator",
        description:
          "Learn how to use the superheat and subcooling calculators for accurate refrigerant charging.",
        readTime: "6 min read",
      },
      {
        title: "A2L Leak Detection Guide",
        description:
          "Best practices for using the A2L refrigerant leak detection and safety calculator.",
        readTime: "5 min read",
      },
      {
        title: "Psychrometric Calculations",
        description:
          "Understanding wet bulb, dry bulb, and humidity calculations for HVAC systems.",
        readTime: "7 min read",
      },
    ],
  },
  {
    category: "HVAC Reference",
    icon: Thermometer,
    colorClass: "text-orange-600 dark:text-orange-400",
    gradientClass: "from-orange-500/10 to-transparent",
    articles: [
      {
        title: "Refrigerant Properties",
        description:
          "Quick reference for common refrigerants including R-410A, R-32, R-454B, and more.",
        readTime: "4 min read",
      },
      {
        title: "PT Chart Reference",
        description:
          "How to use pressure-temperature charts for system diagnostics.",
        readTime: "5 min read",
      },
      {
        title: "System Troubleshooting",
        description:
          "Common HVAC issues and how our AI-powered diagnostics can help identify them.",
        readTime: "8 min read",
      },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function Documentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Debounce search input for better UX
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Keyboard shortcut: press '/' to focus search (unless focused in an input)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredDocs = documentation
    .filter(
      (category) => !selectedCategory || category.category === selectedCategory,
    )
    .map((category) => ({
      ...category,
      articles: category.articles.filter((article) => {
        const q = debouncedSearch.toLowerCase();
        if (!q) return true;
        return (
          article.title.toLowerCase().includes(q) ||
          article.description.toLowerCase().includes(q)
        );
      }),
    }))
    .filter((category) => category.articles.length > 0);

  // If the URL contains ?article=..., open the DocsViewer modal for that article
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const a = params.get("article");
      if (a) {
        setSelectedArticle(decodeURIComponent(a));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/30">
      <Header variant="landing" />

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-slate-500/5 blur-[100px]" />
      </div>

      <PageContainer variant="standard" className="relative z-10 pt-24 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-start justify-between mb-16 gap-8"
        >
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="mb-6 border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 backdrop-blur-sm"
            >
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Engineering
              <span className="bg-gradient-to-r from-orange-600 to-slate-600 bg-clip-text text-transparent ml-3">
                Knowledge Base
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Comprehensive guides, tutorials, and reference materials to help
              you master HVAC&R calculations and get the most out of our tools.
            </p>
          </div>
        </motion.div>

        {/* Search and Navigation */}
        <div className="mb-12 sticky top-20 z-20 bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search documentation (press / to focus)..."
                aria-label="Search documentation"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-lg border-input bg-card/50"
              />
            </div>
            {selectedCategory && (
              <Button
                variant="ghost"
                onClick={() => setSelectedCategory(null)}
                className="shrink-0"
              >
                Clear Filter
              </Button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "secondary" : "ghost"}
              size="sm"
              className={
                selectedCategory === null
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {documentation.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.category}
                  variant={
                    selectedCategory === category.category
                      ? "secondary"
                      : "ghost"
                  }
                  size="sm"
                  className={`${
                    selectedCategory === category.category
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.category
                        ? null
                        : category.category,
                    )
                  }
                >
                  <IconComponent className="h-3 w-3 mr-2" />
                  {category.category}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Documentation Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8"
        >
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No documentation found
              </h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                We're currently updating our knowledge base. Please check back
                soon for detailed guides and tutorials.
              </p>
            </div>
          ) : (
            filteredDocs.map((category) => {
              const IconComponent = category.icon;
              return (
                <motion.div key={category.category} variants={itemVariants}>
                  <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border overflow-hidden">
                    <CardHeader
                      className={`bg-gradient-to-r ${category.gradientClass} border-b border-border py-4`}
                    >
                      <CardTitle
                        className={`flex items-center text-xl font-semibold ${category.colorClass}`}
                      >
                        <IconComponent className="h-6 w-6 mr-3" />
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {category.articles.map((article, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedArticle(article.title)}
                            className="group text-left p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-md hover:bg-muted/50 transition-all duration-300 relative overflow-hidden"
                          >
                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors pr-6">
                                  {article.title}
                                </h3>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {article.description}
                              </p>
                              <div className="flex items-center justify-between mt-auto">
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-muted/50 border-border font-normal"
                                >
                                  {article.readTime}
                                </Badge>
                                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Read Article
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Quick Links */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">
            More Ways to Learn
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <QuickLinkCard
              icon={<Download className="h-8 w-8 text-orange-500" />}
              title="PDF Guides"
              description="Download comprehensive guides for offline reading and sharing with your team."
              action="Download All"
            />
            <QuickLinkCard
              icon={<PlayCircle className="h-8 w-8 text-green-500" />}
              title="Video Tutorials"
              description="Watch step-by-step video walkthroughs of complex calculations and workflows."
              action="Watch Videos"
            />
            <QuickLinkCard
              icon={<Users className="h-8 w-8 text-slate-500" />}
              title="Community Forum"
              description="Connect with thousands of other engineers to share tips and solve problems."
              action="Join Forum"
            />
          </div>
        </div>
      </PageContainer>

      <Footer />

      {selectedArticle && (
        <DocsViewer
          title={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

function QuickLinkCard({
  icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group text-center">
      <CardContent className="p-8 flex flex-col items-center h-full">
        <div className="p-4 bg-muted/50 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
          {description}
        </p>
        <Button
          variant="outline"
          className="mt-auto w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
        >
          {action}
        </Button>
      </CardContent>
    </Card>
  );
}
