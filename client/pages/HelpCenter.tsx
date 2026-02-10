import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  Phone,
} from "lucide-react";
import { SEO } from "@/components/SEO";

const faqs = [
  {
    category: "Getting started",
    questions: [
      {
        question: "How do I get started?",
        answer:
          "Create an account, choose a project template, and run your first cycle analysis within minutes. No credit card is required for the free trial.",
      },
      {
        question: "Which workflows are available?",
        answer:
          "Standard cycle analysis, refrigerant comparison, cascade systems, and compliance reporting are available depending on your plan.",
      },
    ],
  },
  {
    category: "Calculations & data",
    questions: [
      {
        question: "Which refrigerants are supported?",
        answer:
          "We support the most common HVAC&R refrigerants and are expanding low-GWP coverage. Contact us if you need a specific cryogenic fluid.",
      },
      {
        question: "How accurate are results?",
        answer:
          "Calculations align with recognized reference datasets and standard workflows. If you need validation guidance, we can help.",
      },
    ],
  },
  {
    category: "Billing",
    questions: [
      {
        question: "Can I upgrade or downgrade anytime?",
        answer:
          "Yes. Plan changes take effect immediately for upgrades and at the next billing cycle for downgrades.",
      },
      {
        question: "Do you offer enterprise plans?",
        answer:
          "Yes. Enterprise plans include advanced reporting, integrations, and onboarding support.",
      },
    ],
  },
  {
    category: "Support",
    questions: [
      {
        question: "How do I get technical help?",
        answer:
          "Email our support team or submit a ticket from your dashboard. We respond within one business day.",
      },
      {
        question: "Can you help with onboarding?",
        answer:
          "Yes. We offer implementation guidance and training for teams moving from spreadsheets or legacy tools.",
      },
    ],
  },
];

export function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const filteredFaqs = faqs
    .filter(
      (category) => !selectedCategory || category.category === selectedCategory,
    )
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />

      <main className="pt-24 pb-20">
        <SEO
          title="Help Center"
          description="Get answers and support for ThermoNeural HVAC&R and cryogenic engineering workflows."
        />

        <section className="px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Help Center</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold">
              How can we help?
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Search our knowledge base, review common workflows, or contact support.
            </p>

            <div className="mt-8 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search help articles"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                All topics
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {faqs.map((category) => (
                <Button
                  key={category.category}
                  variant={
                    selectedCategory === category.category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.category)}
                >
                  {category.category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4">
          <div className="max-w-5xl mx-auto space-y-10">
            {filteredFaqs.map((category) => (
              <div key={category.category}>
                <h2 className="text-2xl font-semibold capitalize">
                  {category.category}
                </h2>
                <div className="mt-6 space-y-4">
                  {category.questions.map((q, index) => {
                    const questionId = `${category.category}-${index}`;
                    const isExpanded = expandedQuestions.has(questionId);

                    return (
                      <Card key={questionId} className="border-border/60">
                        <CardContent className="p-6">
                          <button
                            className="w-full flex items-center justify-between text-left"
                            onClick={() => toggleQuestion(questionId)}
                          >
                            <div className="flex items-start gap-3">
                              <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
                              <span className="font-medium text-foreground">
                                {q.question}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          {isExpanded && (
                            <p className="mt-4 text-sm text-muted-foreground">
                              {q.answer}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: "Support request",
                detail: "Submit a ticket and get a response within one business day.",
              },
              {
                icon: Mail,
                title: "Email",
                detail: "support@thermoneural.com",
              },
              {
                icon: Phone,
                title: "Phone",
                detail: "+1 (555) 123-4567",
              },
            ].map((item) => (
              <Card key={item.title} className="border-border/60">
                <CardContent className="p-6">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
