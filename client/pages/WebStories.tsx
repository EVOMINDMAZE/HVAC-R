import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Play, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";
import { useSanityWebStories, getSanityImageUrl, getAuthorName, SanityWebStory } from "@/lib/sanity";
import { SanityStoryViewer } from "@/components/web-stories/SanityStoryViewer";
import { Badge } from "@/components/ui/badge";

export function WebStories() {
    const { stories, loading, error } = useSanityWebStories();
    const [selectedStory, setSelectedStory] = useState<SanityWebStory | null>(null);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header variant="landing" />

            <main className="flex-grow pt-24 px-4 pb-20 relative overflow-hidden">
                {/* Ambient Background */}
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-purple-500/5 to-transparent dark:from-purple-900/20 dark:to-transparent pointer-events-none -z-10" />
                <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Visual Learning
                                </Badge>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                                HVAC<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">Stories</span>
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                                Bite-sized visual guides on troubleshooting, refrigerants, and industry updates. Tap to watch.
                            </p>
                        </motion.div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="aspect-[3/5] rounded-xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-2xl border border-border/50">
                            <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-amber-500" />
                            <h3 className="text-lg font-medium mb-2">Could not load stories</h3>
                            <p>Please try again later.</p>
                        </div>
                    )}

                    {/* Stories Grid */}
                    {!loading && !error && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {stories.map((story, index) => (
                                <motion.div
                                    key={story._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                    onClick={() => setSelectedStory(story)}
                                    className="group cursor-pointer relative aspect-[9/16] rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-pink-500/20 transition-all border border-border/50 bg-black"
                                >
                                    {/* Poster Image */}
                                    <img
                                        src={getSanityImageUrl(story.coverImage)}
                                        alt={story.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                    {/* Play Icon */}
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 border border-white/30">
                                        <Play className="h-4 w-4 text-white fill-current" />
                                    </div>

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-400 to-pink-600 p-[2px]">
                                                <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                                    {/* Placeholder avatar or author's */}
                                                    <img
                                                        src={getSanityImageUrl(story.author?.image)}
                                                        alt="Author"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-white/90">{getAuthorName(story)}</span>
                                        </div>

                                        <h3 className="text-white font-bold leading-snug line-clamp-3 mb-1 drop-shadow-md">
                                            {story.title}
                                        </h3>
                                    </div>

                                    {/* Selection Ring on Hover */}
                                    <div className="absolute inset-0 border-2 border-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Empty State if no stories */}
                    {!loading && !error && stories.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            <p>No stories found. Check back soon!</p>
                        </div>
                    )}

                </div>
            </main>

            {/* Story Viewer Overlay */}
            {selectedStory && (
                <SanityStoryViewer
                    story={selectedStory}
                    onClose={() => setSelectedStory(null)}
                />
            )}

            <Footer />
        </div>
    );
}
