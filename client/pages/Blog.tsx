import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, TrendingUp } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Understanding R-410A Phase-Out: What Engineers Need to Know",
    excerpt: "A comprehensive guide to the upcoming R-410A phase-out and what it means for HVAC system design.",
    author: "Dr. Sarah Chen",
    date: "2024-01-15",
    category: "Refrigerants",
    readTime: "8 min read",
    featured: true
  },
  {
    id: 2,
    title: "Optimizing Cascade Refrigeration Systems for Industrial Applications",
    excerpt: "Best practices for designing efficient cascade systems with CO₂ and conventional refrigerants.",
    author: "Michael Rodriguez",
    date: "2024-01-10",
    category: "System Design",
    readTime: "12 min read",
    featured: false
  },
  {
    id: 3,
    title: "Natural Refrigerants: A Sustainable Future for HVAC&R",
    excerpt: "Exploring the benefits and challenges of implementing natural refrigerants in modern systems.",
    author: "Emma Thompson",
    date: "2024-01-05",
    category: "Sustainability",
    readTime: "6 min read",
    featured: false
  },
  {
    id: 4,
    title: "Energy Efficiency Calculations in Modern Heat Pump Design",
    excerpt: "Advanced techniques for maximizing efficiency in commercial heat pump applications.",
    author: "Dr. James Wilson",
    date: "2023-12-28",
    category: "Energy Efficiency",
    readTime: "10 min read",
    featured: false
  },
  {
    id: 5,
    title: "Thermodynamic Property Calculations: Beyond the Basics",
    excerpt: "Deep dive into advanced property calculation methods for complex refrigerant mixtures.",
    author: "Lisa Park",
    date: "2023-12-20",
    category: "Thermodynamics",
    readTime: "15 min read",
    featured: false
  }
];

export function Blog() {
  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-blue-600 bg-blue-100">
            Engineering Insights
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            HVAC&R Engineering 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Blog
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stay up-to-date with the latest trends, technologies, and best practices 
            in HVAC&R engineering and refrigeration systems.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Card className="bg-white shadow-xl border-blue-200 mb-12">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Featured
                </Badge>
                <div className="flex items-center text-white/80 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Trending
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4 bg-blue-100 text-blue-600 hover:bg-blue-200">
                    {featuredPost.category}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-6">
                    <User className="h-4 w-4 mr-2" />
                    <span className="mr-4">{featuredPost.author}</span>
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="mr-4">{new Date(featuredPost.date).toLocaleDateString()}</span>
                    <span>{featuredPost.readTime}</span>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Read Full Article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600">Featured Engineering Insight</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Posts */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Recent Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <Card key={post.id} className="bg-white shadow-lg border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Badge className="mb-2 w-fit bg-gray-100 text-gray-600 hover:bg-gray-200">
                    {post.category}
                  </Badge>
                  <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-3">{post.author}</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{post.readTime}</span>
                    <Button variant="outline" size="sm">
                      Read More
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter for the latest insights in HVAC&R engineering, 
              new tool releases, and industry updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md text-gray-900"
              />
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
