import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useSanityPosts, getSanityImageUrl, getAuthorName, getCategory } from "@/lib/sanity";
import { format } from "date-fns";
import { Link } from "react-router-dom";

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
  const { posts, loading, error } = useSanityPosts();

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const regularPosts = posts.length > 1 ? posts.slice(1) : [];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

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

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-10 text-red-500">
              <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
              <p>Unable to load posts. Please try again later.</p>
            </div>
          )}

          {!loading && !error && (
            <>
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
                            {getCategory(featuredPost)}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground font-medium">
                            <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                            Trending Now
                          </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {featuredPost.title}
                        </h2>

                        <p className="text-muted-foreground text-lg mb-8 leading-relaxed line-clamp-3">
                          {featuredPost.excerpt}
                        </p>

                        <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-8 gap-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-500" />
                            {getAuthorName(featuredPost)}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            {formatDate(featuredPost.publishedAt)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            5 min read
                          </div>
                        </div>



                        <Link to={featuredPost.slug?.current ? `/blog/${featuredPost.slug.current}` : '#'}>
                          <Button className="w-fit bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all">
                            Read Case Study <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>


                      </div>
                      <div className="relative h-64 md:h-auto overflow-hidden">
                        <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors z-10" />
                        <img
                          src={getSanityImageUrl(featuredPost.mainImage)}
                          alt="Featured Blog Post"
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Latest Articles Grid */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-8 flex items-center">
                  <span className="w-1 h-8 bg-blue-600 mr-4 rounded-full"></span>
                  Latest Articles
                </h3>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {regularPosts.map((post) => (
                    <motion.div key={post._id} variants={itemVariants}>
                      <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group flex flex-col overflow-hidden">
                        <div className="relative h-48 overflow-hidden">
                          <Badge className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-md text-foreground hover:bg-background">
                            {getCategory(post)}
                          </Badge>
                          <img
                            src={getSanityImageUrl(post.mainImage)}
                            alt={post.title}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <CardHeader>
                          <div className="flex items-center text-xs text-muted-foreground mb-3 space-x-3">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(post.publishedAt)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              5 min
                            </span>
                          </div>
                          <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {post.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between">
                          <p className="text-muted-foreground mb-6 line-clamp-3 text-sm">
                            {post.excerpt}
                          </p>



                          <Link to={post.slug?.current ? `/blog/${post.slug.current}` : '#'}>
                            <Button variant="ghost" className="w-full justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 group/btn">
                              Read Article
                              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform text-blue-500" />
                            </Button>
                          </Link>


                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </>
          )}

          {/* Newsletter Section - Keeping Static for Now */}
          <div className="mt-24 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-3xl p-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 mask-image-gradient" />
            <div className="bg-card/40 backdrop-blur-xl rounded-[20px] p-8 md:p-12 text-center relative z-10">
              <span className="inline-block p-3 rounded-2xl bg-blue-500/10 mb-6">
                <AlertTriangle className="h-8 w-8 text-blue-500" />
              </span>
              <h3 className="text-3xl font-bold mb-4">Stay in the Loop</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg">
                Get the latest engineering insights, software updates, and industry news delivered directly to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-grow px-4 py-3 rounded-lg bg-background/50 border border-border focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                No spam, ever. Unsubscribe at any time.
              </p>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
