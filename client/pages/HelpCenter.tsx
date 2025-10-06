import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
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
  Zap
} from "lucide-react";
import { BackButton } from "@/components/BackButton";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create an account and get started?",
        answer: "Creating an account is simple! Click 'Sign Up' in the top right corner, fill in your details, and you'll receive a confirmation email. Once verified, you can immediately start using our calculation tools with your free tier allocation."
      },
      {
        question: "What calculation tools are available?",
        answer: "We offer three main calculation tools: Standard Cycle Analysis for basic refrigeration cycles, Refrigerant Comparison for evaluating different refrigerants, and Cascade System Analysis for complex two-stage systems. Each tool provides detailed thermodynamic calculations and performance metrics."
      },
      {
        question: "Is there a free trial available?",
        answer: "Yes! Every new account includes 10 free calculations per month. This allows you to fully test our tools before deciding on a paid plan. No credit card is required for the free tier."
      }
    ]
  },
  {
    category: "Calculations",
    questions: [
      {
        question: "Which refrigerants are supported?",
        answer: "We support all major refrigerants including R-134a, R-410A, R-404A, R-448A, R-32, R-290 (Propane), R-744 (CO₂), R-507A, and many others. Our database is regularly updated to include new and alternative refrigerants as they become available."
      },
      {
        question: "How accurate are the thermodynamic calculations?",
        answer: "Our calculations use industry-standard NIST property data and validated thermodynamic models. Results are accurate to within ±1% for most operating conditions, which meets or exceeds industry standards for engineering calculations."
      },
      {
        question: "Can I save and export my calculation results?",
        answer: "Yes! All calculations are automatically saved to your account history. You can export results in CSV, PDF, or Excel formats. Premium users can also set up automated reports and batch processing."
      },
      {
        question: "What's the difference between the calculation methods?",
        answer: "Standard Cycle uses basic vapor compression cycle analysis. Comparison Tool runs the same calculation across multiple refrigerants simultaneously. Cascade System handles complex two-stage systems with different refrigerants in each stage."
      }
    ]
  },
  {
    category: "Account & Billing",
    questions: [
      {
        question: "How do the pricing plans work?",
        answer: "We offer tiered plans based on calculation usage: Free (10 calculations/month), Professional (100 calculations/month), and Enterprise (unlimited). All plans include access to all calculation tools, with advanced features like API access available on higher tiers."
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Yes, you can change your plan at any time from your account settings. Upgrades take effect immediately, while downgrades take effect at the next billing cycle. Unused calculations don't roll over between months."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. Enterprise customers can also arrange for purchase orders and invoice billing."
      }
    ]
  },
  {
    category: "Technical Support",
    questions: [
      {
        question: "I'm getting unexpected results, what should I check?",
        answer: "First, verify your input parameters are within realistic ranges for your system. Check that refrigerant properties are appropriate for your operating conditions. If results still seem incorrect, contact our support team with your specific inputs and we'll help troubleshoot."
      },
      {
        question: "The calculation is taking too long, what's wrong?",
        answer: "Most calculations complete in under 30 seconds. Long delays usually indicate server load or connectivity issues. Try refreshing the page and rerunning the calculation. If problems persist, check our status page or contact support."
      },
      {
        question: "Can I integrate these tools with my existing software?",
        answer: "Yes! Professional and Enterprise plans include API access for integration with your existing engineering software. We provide detailed documentation and code examples for common platforms like MATLAB, Python, and Excel."
      }
    ]
  }
];

export function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const filteredFaqs = faqs.filter(category => 
    !selectedCategory || category.category === selectedCategory
  ).map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="landing" />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 text-blue-600 bg-blue-100">
              Help Center
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              How can we
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> help you?</span>
            </h1>
            <p className="text-xl text-gray-600 mt-3">
              Find answers to common questions, get technical support, and learn how to make the most of our HVAC&R calculation tools.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BackButton fallback="/dashboard" />
          </div>
        </div>

        {/* Search */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg border-blue-200 focus:border-blue-500 rounded-xl"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Topics
                  </Button>
                  {faqs.map((category) => (
                    <Button
                      key={category.category}
                      variant={selectedCategory === category.category ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.category)}
                    >
                      {category.category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-white shadow-lg border-gray-200 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Need More Help?</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Live Chat
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Us
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredFaqs.map((category) => (
                <Card key={category.category} className="bg-white shadow-lg border-gray-200">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-xl text-gray-900">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {category.questions.map((faq, index) => {
                      const questionId = `${category.category}-${index}`;
                      const isExpanded = expandedQuestions.has(questionId);
                      
                      return (
                        <div key={index} className="border-b last:border-b-0">
                          <button
                            className="w-full p-6 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                            onClick={() => toggleQuestion(questionId)}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 pr-8">
                                {faq.question}
                              </h3>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-6 pb-6">
                              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Section */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mt-12">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Still Need Help?</h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Can't find what you're looking for? Our engineering support team is here to help 
                  with technical questions, account issues, and everything in between.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Live Chat
                  </Button>
                  <Button variant="outline" className="border-white text-white bg-transparent hover:bg-white/10">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resource Cards */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <Card className="bg-white shadow-lg border-green-200">
            <CardContent className="p-6 text-center">
              <Book className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-gray-600 mb-4">Comprehensive guides and technical references</p>
              <Button variant="outline" className="border-green-200 hover:bg-green-50">
                Browse Docs
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600 mb-4">Connect with other engineers and share knowledge</p>
              <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
                Join Community
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-orange-200">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Start</h3>
              <p className="text-gray-600 mb-4">Get up and running with step-by-step tutorials</p>
              <Button variant="outline" className="border-orange-200 hover:bg-orange-50">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
