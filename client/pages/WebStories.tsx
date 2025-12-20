import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STORIES_DATA, Story } from "@/data/stories";
import { StoryViewer } from "@/components/web-stories/StoryViewer";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function WebStories() {
    const [activeStory, setActiveStory] = useState<Story | null>(null);

    const handleOpenStory = (story: Story) => {
        setActiveStory(story);
    };

    const handleCloseStory = () => {
        setActiveStory(null);
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20 pt-20 px-4 md:px-8">

            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        HVAC AI Stories
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto text-lg">
                        Explore the future of cooling through immersive, byte-sized updates.
                    </p>
                </div>

                {/* Stories Row (Instagram Style) */}
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide justify-center">
                    {STORIES_DATA.map((story) => (
                        <button
                            key={story.id}
                            onClick={() => handleOpenStory(story)}
                            className="flex flex-col items-center gap-2 group min-w-[80px]"
                        >
                            <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 group-hover:scale-110 transition-transform duration-300">
                                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden relative">
                                    <img src={story.avatar} alt={story.title} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-center truncate w-full">{story.title}</span>
                        </button>
                    ))}
                </div>

                {/* Featured Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {STORIES_DATA.map((story, index) => (
                        <motion.div
                            key={story.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleOpenStory(story)}
                            className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group shadow-2xl border border-white/10"
                        >
                            {/* Cover Image - take first image slide or fallback */}
                            <img
                                src={story.slides.find(s => s.type === 'image' || s.type === 'infographic')?.mediaUrl || story.slides.find(s => s.type === 'image')?.content || "https://images.unsplash.com/photo-1504384308090-c54be3855833?w=800&auto=format&fit=crop&q=60"}
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                                    <Play className="w-4 h-4 text-white fill-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-1 group-hover:text-blue-300 transition-colors">{story.title}</h3>
                                <p className="text-sm text-gray-300 line-clamp-2">
                                    {story.slides[0].type === 'text' ? story.slides[0].content : "Watch the story..."}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>

            {/* Full Screen Story Viewer Overlay */}
            <AnimatePresence>
                {activeStory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50"
                    >
                        <StoryViewer
                            story={activeStory}
                            onClose={handleCloseStory}
                            onNextStory={() => {
                                const currentIndex = STORIES_DATA.findIndex(s => s.id === activeStory.id);
                                if (currentIndex < STORIES_DATA.length - 1) {
                                    setActiveStory(STORIES_DATA[currentIndex + 1]);
                                } else {
                                    handleCloseStory();
                                }
                            }}
                            onPrevStory={() => {
                                const currentIndex = STORIES_DATA.findIndex(s => s.id === activeStory.id);
                                if (currentIndex > 0) {
                                    setActiveStory(STORIES_DATA[currentIndex - 1]);
                                } else {
                                    handleCloseStory();
                                }
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
