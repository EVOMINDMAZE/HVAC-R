import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  useSanityPost,
  getSanityImageUrl,
  getAuthorName,
  getCategory,
} from "@/lib/sanity";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading, error } = useSanityPost(slug);

  if (loading) {
    return (
      <PublicPageShell mainClassName="pt-24 pb-20">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </PublicPageShell>
    );
  }

  if (error || !post) {
    return (
      <PublicPageShell mainClassName="pt-24 pb-20">
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-semibold">Post Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The article you are looking for does not exist or has been removed.
          </p>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell mainClassName="pt-24 pb-20">
        <SEO title={post.title} description={post.excerpt || post.title} />

        <section className="px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/blog"
              className="inline-flex items-center text-muted-foreground hover:text-primary mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Articles
            </Link>

            <p className="text-xs uppercase tracking-[0.2em] text-primary">
              {getCategory(post)}
            </p>
            <h1 className="mt-4 text-3xl md:text-5xl font-semibold">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>{getAuthorName(post)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), "MMMM d, yyyy")
                    : "Recently"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-border/60">
              <img
                src={getSanityImageUrl(post.mainImage)}
                alt={post.title}
                className="w-full h-72 md:h-96 object-cover"
              />
            </div>
            <article className="prose prose-lg max-w-none mt-10 text-foreground prose-headings:font-semibold prose-a:text-primary">
              <ReactMarkdown>{post.body || "No content available."}</ReactMarkdown>
            </article>

            <div className="mt-16 pt-8 border-t flex justify-between items-center">
              <p className="text-muted-foreground italic">Thanks for reading.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigator.share?.({
                    title: post.title,
                    url: window.location.href,
                  })
                }
              >
                Share Article
              </Button>
            </div>
          </div>
        </section>
    </PublicPageShell>
  );
}
