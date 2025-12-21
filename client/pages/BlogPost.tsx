import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useSanityPost, getSanityImageUrl, getAuthorName, getCategory } from "@/lib/sanity";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const { post, loading, error } = useSanityPost(slug);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
                <p className="text-muted-foreground mb-6">The article you are looking for does not exist or has been removed.</p>
                <Link to="/blog">
                    <Button>Back to Blog</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 bg-background">
            {/* Hero Section */}
            <div className="relative w-full h-[400px] md:h-[500px] mb-12">
                <div className="absolute inset-0 bg-black/50 z-10" />
                <img
                    src={getSanityImageUrl(post.mainImage)}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 z-20 flex flex-col justify-end container mx-auto px-4 pb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                                {getCategory(post)}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight max-w-4xl">
                            {post.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{getAuthorName(post)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "Recently"}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 max-w-4xl">
                <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Articles
                </Link>

                <motion.article
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl"
                >
                    <ReactMarkdown>{post.body || "No content available."}</ReactMarkdown>
                </motion.article>

                {/* Share / Tags Footer (Optional Placeholder) */}
                <div className="mt-16 pt-8 border-t flex justify-between items-center">
                    <p className="text-muted-foreground italic">Thanks for reading!</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}>
                            Share Article
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
