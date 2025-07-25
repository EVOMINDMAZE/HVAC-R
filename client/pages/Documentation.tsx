import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Book, 
  Search, 
  PlayCircle, 
  FileText, 
  Calculator, 
  TrendingUp, 
  BarChart3, 
  Users,
  ChevronRight,
  Download
} from "lucide-react";

const documentation = [
  {
    category: "Getting Started",
    icon: PlayCircle,
    color: "from-green-600 to-emerald-600",
    articles: [
      { title: "Quick Start Guide", description: "Get up and running in 5 minutes", readTime: "5 min" },
      { title: "Account Setup", description: "Creating and configuring your account", readTime: "3 min" },
      { title: "First Calculation", description: "Running your first refrigeration cycle analysis", readTime: "8 min" },
      { title: "Understanding Results", description: "Interpreting calculation outputs", readTime: "10 min" }
    ]
  },
  {
    category: "Standard Cycle Analysis",
    icon: Calculator,
    color: "from-blue-600 to-indigo-600",
    articles: [
      { title: "Basic Cycle Theory", description: "Fundamental thermodynamic principles", readTime: "15 min" },
      { title: "Input Parameters", description: "Understanding temperature, pressure, and property inputs", readTime: "12 min" },
      { title: "Refrigerant Properties", description: "Working with different refrigerant types", readTime: "10 min" },
      { title: "Performance Metrics", description: "COP, capacity, and efficiency calculations", readTime: "8 min" }
    ]
  },
  {
    category: "Refrigerant Comparison",
    icon: TrendingUp,
    color: "from-purple-600 to-indigo-600",
    articles: [
      { title: "Comparison Methodology", description: "How we compare different refrigerants", readTime: "12 min" },
      { title: "Environmental Impact", description: "GWP, ODP, and environmental considerations", readTime: "15 min" },
      { title: "Performance Analysis", description: "Comparing efficiency and capacity", readTime: "10 min" },
      { title: "Best Practices", description: "Selecting the right refrigerant for your application", readTime: "18 min" }
    ]
  },
  {
    category: "Cascade Systems",
    icon: BarChart3,
    color: "from-orange-600 to-red-600",
    articles: [
      { title: "Cascade Theory", description: "Understanding two-stage refrigeration", readTime: "20 min" },
      { title: "System Design", description: "Designing efficient cascade systems", readTime: "25 min" },
      { title: "Optimization", description: "Maximizing performance and efficiency", readTime: "15 min" },
      { title: "Troubleshooting", description: "Common issues and solutions", readTime: "12 min" }
    ]
  },
  {
    category: "API Reference",
    icon: FileText,
    color: "from-gray-600 to-gray-700",
    articles: [
      { title: "API Overview", description: "Getting started with our calculation API", readTime: "8 min" },
      { title: "Authentication", description: "API keys and security", readTime: "5 min" },
      { title: "Endpoints", description: "Complete list of available endpoints", readTime: "12 min" },
      { title: "Examples", description: "Code examples and use cases", readTime: "20 min" }
    ]
  },
  {
    category: "Advanced Topics",
    icon: Users,
    color: "from-teal-600 to-cyan-600",
    articles: [
      { title: "Custom Properties", description: "Working with custom refrigerant properties", readTime: "25 min" },
      { title: "Batch Processing", description: "Running multiple calculations efficiently", readTime: "15 min" },
      { title: "Data Export", description: "Exporting and analyzing results", readTime: "10 min" },
      { title: "Integration", description: "Integrating with other engineering tools", readTime: "30 min" }
    ]
  }
];

export function Documentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredDocs = documentation.filter(category => 
    !selectedCategory || category.category === selectedCategory
  ).map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.articles.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="landing" />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-blue-600 bg-blue-100">
            Documentation
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Engineering 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Documentation
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive guides, tutorials, and reference materials to help you master 
            HVAC&R calculations and get the most out of our tools.
          </p>
        </div>

        {/* Search and Navigation */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500"
              />
            </div>
            <Button 
              variant="outline" 
              className="border-blue-200 hover:bg-blue-50"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
          </div>

          {/* Category Filter */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
            {documentation.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.category}
                  variant={selectedCategory === category.category ? "default" : "outline"}
                  className={`justify-start text-sm h-auto p-3 ${
                    selectedCategory === category.category 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.category ? null : category.category
                  )}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  <span className="truncate">{category.category}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Documentation Content */}
        <div className="grid gap-8">
          {filteredDocs.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.category} className="bg-white shadow-lg border-gray-200">
                <CardHeader className={`bg-gradient-to-r ${category.color} text-white`}>
                  <CardTitle className="flex items-center text-xl">
                    <IconComponent className="h-6 w-6 mr-3" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.articles.map((article, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {article.readTime}
                          </Badge>
                          <div className="flex items-center text-xs text-gray-500">
                            <Book className="h-3 w-3 mr-1" />
                            Read
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-6 text-center">
              <Download className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Guides</h3>
              <p className="text-gray-600 mb-4">Download comprehensive guides for offline reading</p>
              <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
                Download All
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-green-200">
            <CardContent className="p-6 text-center">
              <PlayCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Tutorials</h3>
              <p className="text-gray-600 mb-4">Step-by-step video guides and walkthroughs</p>
              <Button variant="outline" className="border-green-200 hover:bg-green-50">
                Watch Videos
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-purple-200">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Forum</h3>
              <p className="text-gray-600 mb-4">Get help from other engineers and share knowledge</p>
              <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
                Join Forum
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
