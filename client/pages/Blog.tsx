import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

const blogPosts: Array<{
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  featured: boolean;
}> = [];

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

export function Blog() {
  const featuredPost = blogPosts.find((post) => post.featured);
  const regularPosts = blogPosts.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <Header variant="landing" />

      <main className="flex-grow pt-24 px-4 relative overflow-hidden pb-20">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="mb-6 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 backdrop-blur-sm">
              Engineering Insights
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              The ThermoNeural <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Blog
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Deep dives into thermodynamic modeling, refrigerant trends, and software engineering for the HVAC&R industry.
            </p>
          </motion.div>

          {/* Featured Post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <Card className="bg-card/50 backdrop-blur-md shadow-xl border-border overflow-hidden group hover:border-blue-500/30 transition-colors duration-300">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center space-x-3 mb-6">
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 border-none">
                        {featuredPost.category}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground font-medium">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        Trending Now
                      </div>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {featuredPost.title}
                    </h2>

                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-8 gap-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-blue-500" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        {new Date(featuredPost.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        {featuredPost.readTime}
                      </div>
                    </div>

                    <Button size="lg" className="w-fit bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 group-hover:translate-x-1 transition-transform">
                      Read Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/40 dark:to-purple-950/40 flex items-center justify-center p-12 min-h-[300px]">
                    <div className="relative w-full max-w-sm aspect-video bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex items-center justify-center border border-border group-hover:scale-105 transition-transform duration-500">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full">
                        <TrendingUp className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Recent Posts Grid */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold mb-8">Latest Articles</h3>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {regularPosts.map((post) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <Card className="h-full bg-card/50 backdrop-blur-sm shadow-lg border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {post.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">{post.readTime}</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                      <p className="text-muted-foreground mb-6 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-2" />
                          {post.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-2" />
                          {new Date(post.date).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-16 text-center"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-[100px] pointer-events-none rounded-full" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
              <p className="text-slate-300 text-lg mb-8">
                Get the latest engineering insights, software updates, and industry news delivered directly to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
                <div className="flex-grow">
                  <input
                    type="email"
                    placeholder="Enter your work email"
                    className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl font-semibold shadow-lg shadow-blue-600/20">
                  Subscribe
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-4">No spam, unsubscribe anytime.</p>
            </div>
          </motion.div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
