import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Book,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create an account and get started?",
        answer:
          "Creating an account is simple! Click 'Sign Up' in the top right corner, fill in your details, and you'll receive a confirmation email. Once verified, you can immediately start using our calculation tools with your free tier allocation.",
      },
      {
        question: "What calculation tools are available?",
        answer:
          "We offer three main calculation tools: Standard Cycle Analysis for basic refrigeration cycles, Refrigerant Comparison for evaluating different refrigerants, and Cascade System Analysis for complex two-stage systems. Each tool provides detailed thermodynamic calculations and performance metrics.",
      },
      {
        question: "Is there a free trial available?",
        answer:
          "Yes! Every new account includes 10 free calculations per month. This allows you to fully test our tools before deciding on a paid plan. No credit card is required for the free tier.",
      },
    ],
  },
  {
    category: "Calculations",
    questions: [
      {
        question: "Which refrigerants are supported?",
        answer:
          "We support all major refrigerants including R-134a, R-410A, R-404A, R-448A, R-32, R-290 (Propane), R-744 (CO₂), R-507A, and many others. Our database is regularly updated to include new and alternative refrigerants as they become available.",
      },
      {
        question: "How accurate are the thermodynamic calculations?",
        answer:
          "Our calculations use industry-standard NIST property data and validated thermodynamic models. Results are accurate to within ±1% for most operating conditions, which meets or exceeds industry standards for engineering calculations.",
      },
      {
        question: "Can I save and export my calculation results?",
        answer:
          "Yes! All calculations are automatically saved to your account history. You can export results in CSV, PDF, or Excel formats. Premium users can also set up automated reports and batch processing.",
      },
      {
        question: "What's the difference between the calculation methods?",
        answer:
          "Standard Cycle uses basic vapor compression cycle analysis. Comparison Tool runs the same calculation across multiple refrigerants simultaneously. Cascade System handles complex two-stage systems with different refrigerants in each stage.",
      },
    ],
  },
  {
    category: "Account & Billing",
    questions: [
      {
        question: "How do the pricing plans work?",
        answer:
          "We offer tiered plans based on calculation usage: Free (10 calculations/month), Professional (100 calculations/month), and Enterprise (unlimited). All plans include access to all calculation tools, with advanced features like API access available on higher tiers.",
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer:
          "Yes, you can change your plan at any time from your account settings. Upgrades take effect immediately, while downgrades take effect at the next billing cycle. Unused calculations don't roll over between months.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. Enterprise customers can also arrange for purchase orders and invoice billing.",
      },
    ],
  },
  {
    category: "Technical Support",
    questions: [
      {
        question: "I'm getting unexpected results, what should I check?",
        answer:
          "First, verify your input parameters are within realistic ranges for your system. Check that refrigerant properties are appropriate for your operating conditions. If results still seem incorrect, contact our support team with your specific inputs and we'll help troubleshoot.",
      },
      {
        question: "The calculation is taking too long, what's wrong?",
        answer:
          "Most calculations complete in under 30 seconds. Long delays usually indicate server load or connectivity issues. Try refreshing the page and rerunning the calculation. If problems persist, check our status page or contact support.",
      },
      {
        question: "Can I integrate these tools with my existing software?",
        answer:
          "Yes! Professional and Enterprise plans include API access for integration with your existing engineering software. We provide detailed documentation and code examples for common platforms like MATLAB, Python, and Excel.",
      },
    ],
  },
  {
    category: "Cascade Troubleshooting",
    questions: [
      {
        question: "How do I troubleshoot cascade system convergence issues?",
        answer:
          "Ensure your intermediate temperature guesses are reasonable and that the heat exchanger approach temperature is feasible (typically > 3-5K).",
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
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/30">
      <Header variant="landing" />

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-slate-500/10 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-slate-500/10 blur-[100px] animate-pulse delay-2000" />
      </div>

      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-[1600px] mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <Badge
              variant="outline"
              className="mb-6 border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 backdrop-blur-sm"
            >
              Help Center
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              How can we
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent ml-3">
                help you?
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mt-3 leading-relaxed">
              Find answers to common questions, get technical support, and learn
              how to make the most of our HVAC&R calculation tools.
            </p>

            {/* Search Input */}
            <div className="mt-8 relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for answers, topics, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-7 text-lg border-primary/20 focus:border-orange-500 focus:ring-orange-500 rounded-2xl shadow-lg shadow-orange-500/5 bg-card/80 backdrop-blur-md"
              />
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar with Sticky Navigation */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                <Card className="bg-card/50 backdrop-blur-md shadow-lg border-border overflow-hidden">
                  <CardHeader className="bg-muted/50 border-b border-border pb-4">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 space-y-1">
                    <Button
                      variant={
                        selectedCategory === null ? "secondary" : "ghost"
                      }
                      className={`w-full justify-start ${selectedCategory === null ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-muted"}`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Topics
                    </Button>
                    {faqs.map((category) => (
                      <Button
                        key={category.category}
                        variant={
                          selectedCategory === category.category
                            ? "secondary"
                            : "ghost"
                        }
                        className={`w-full justify-start text-left truncate ${selectedCategory === category.category ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-muted"}`}
                        onClick={() => setSelectedCategory(category.category)}
                      >
                        {category.category}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-600 to-slate-700 text-white shadow-lg border-none">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">Need More Help?</h3>
                    <p className="text-orange-100 text-sm mb-4">
                      Our engineering support team is standing by.
                    </p>
                    <Button
                      variant="secondary"
                      className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                      onClick={() =>
                        (window.location.href =
                          "mailto:support@thermoneural.com")
                      }
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((category) => (
                    <motion.div key={category.category} variants={itemVariants}>
                      <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border py-4">
                          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                            <HashIcon category={category.category} />
                            {category.category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-border">
                          {category.questions.map((faq, index) => {
                            const questionId = `${category.category}-${index}`;
                            const isExpanded =
                              expandedQuestions.has(questionId);

                            return (
                              <div
                                key={index}
                                className="group transition-colors bg-card/0 hover:bg-muted/30"
                              >
                                <button
                                  className="w-full p-6 text-left focus:outline-none"
                                  onClick={() => toggleQuestion(questionId)}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <h3
                                      className={`text-base font-medium transition-colors ${isExpanded ? "text-primary" : "text-foreground group-hover:text-primary"}`}
                                    >
                                      {faq.question}
                                    </h3>
                                    <div
                                      className={`mt-1 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-5 w-5 text-primary" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </button>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-6 pb-6 pt-0">
                                        <p className="text-muted-foreground leading-relaxed pl-1 border-l-2 border-primary/20">
                                          {faq.answer}
                                        </p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">
                      No results found
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      Try adjusting your search terms.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Resource Cards */}
          <div className="mt-24">
            <h2 className="text-2xl font-bold text-center mb-12">
              Other Resources
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <ResourceCard
                icon={<Book className="h-8 w-8 text-green-500" />}
                title="Documentation"
                description="Comprehensive guides and technical references for all our tools."
                action="Browse Docs"
                colorClass="green"
              />
              <ResourceCard
                icon={<Users className="h-8 w-8 text-orange-500" />}
                title="Community"
                description="Connect with other engineers, share knowledge, and get advice."
                action="Join Community"
                colorClass="blue"
              />
              <ResourceCard
                icon={<Zap className="h-8 w-8 text-amber-500" />}
                title="Quick Start"
                description="Get up and running with step-by-step interactive tutorials."
                action="Get Started"
                colorClass="amber"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Helper Components
function HashIcon({ category }: { category: string }) {
  let icon = <HelpCircle className="h-5 w-5 mr-2 text-primary" />;
  if (category.includes("Account"))
    icon = <Users className="h-5 w-5 mr-2 text-primary" />;
  if (category.includes("Calculation"))
    icon = <Zap className="h-5 w-5 mr-2 text-primary" />;
  if (category.includes("Support") || category.includes("Troubleshooting"))
    icon = <Phone className="h-5 w-5 mr-2 text-primary" />;

  return icon;
}

function ResourceCard({
  icon,
  title,
  description,
  action,
  colorClass,
}: {
  icon: any;
  title: string;
  description: string;
  action: string;
  colorClass: string;
}) {
  const colorMap: Record<string, string> = {
    green: "hover:border-green-500/50 hover:shadow-green-500/20",
    blue: "hover:border-orange-500/50 hover:shadow-orange-500/20",
    amber: "hover:border-amber-500/50 hover:shadow-amber-500/20",
  };

  return (
    <Card
      className={`bg-card/50 backdrop-blur-sm border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colorMap[colorClass]} group`}
    >
      <CardContent className="p-8 text-center flex flex-col items-center h-full">
        <div
          className={`p-4 rounded-2xl bg-${colorClass}-50 dark:bg-${colorClass}-900/10 mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground mb-8 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
        <Button
          variant="outline"
          className="mt-auto group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
        >
          {action} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
