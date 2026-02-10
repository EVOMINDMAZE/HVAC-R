import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, AlertTriangle } from "lucide-react";
import {
  useSanityPosts,
  getSanityImageUrl,
  getAuthorName,
  getCategory,
} from "@/lib/sanity";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

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
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />

      <main className="pt-24 pb-20">
        <SEO
          title="Blog"
          description="Insights on HVAC&R engineering, refrigeration, and cryogenic system design."
        />

        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Blog</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold">
              Engineering insights for modern HVAC&R teams.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Practical guidance on thermodynamic modeling, refrigerant transitions, and compliance-ready reporting.
            </p>
          </div>
        </section>

        <section className="px-4">
          <div className="max-w-6xl mx-auto">
            {loading && (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            )}

            {error && (
              <div className="text-center py-10 text-destructive">
                <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
                <p>Unable to load posts. Please try again later.</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {featuredPost && (
                  <Card className="border-border/60 overflow-hidden mb-12">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="p-8 md:p-12 flex flex-col justify-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-primary">Featured</p>
                        <h2 className="mt-4 text-3xl md:text-4xl font-semibold">
                          {featuredPost.title}
                        </h2>
                        <p className="mt-4 text-muted-foreground">
                          {featuredPost.excerpt}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            {getAuthorName(featuredPost)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {formatDate(featuredPost.publishedAt)}
                          </div>
                        </div>
                        <Link
                          to={
                            featuredPost.slug?.current
                              ? `/blog/${featuredPost.slug.current}`
                              : "#"
                          }
                          className="mt-6"
                        >
                          <Button>
                            Read article
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <div className="relative h-64 md:h-auto">
                        <img
                          src={getSanityImageUrl(featuredPost.mainImage)}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map((post) => (
                    <Card key={post._id} className="border-border/60 overflow-hidden flex flex-col">
                      <div className="h-44">
                        <img
                          src={getSanityImageUrl(post.mainImage)}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground flex flex-col gap-4">
                        <p>{post.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{getCategory(post)}</span>
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                        <Link
                          to={post.slug?.current ? `/blog/${post.slug.current}` : "#"}
                          className="text-primary underline"
                        >
                          Read more
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
