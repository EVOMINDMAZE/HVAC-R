import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Story, StorySlide } from "@/data/stories";
import { cn } from "@/lib/utils";

interface StoryViewerProps {
    story: Story;
    onClose: () => void;
    onNextStory?: () => void;
    onPrevStory?: () => void;
}

export function StoryViewer({ story, onClose, onNextStory, onPrevStory }: StoryViewerProps) {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const pausedTimeRef = useRef<number>(0);
    const requestRef = useRef<number>();

    const currentSlide = story.slides[currentSlideIndex];

    const handleNext = useCallback(() => {
        if (currentSlideIndex < story.slides.length - 1) {
            setCurrentSlideIndex((prev) => prev + 1);
            setProgress(0);
            pausedTimeRef.current = 0;
            startTimeRef.current = null;
        } else {
            onNextStory ? onNextStory() : onClose();
        }
    }, [currentSlideIndex, story.slides.length, onNextStory, onClose]);

    const handlePrev = useCallback(() => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex((prev) => prev - 1);
            setProgress(0);
            pausedTimeRef.current = 0;
            startTimeRef.current = null;
        } else {
            onPrevStory ? onPrevStory() : onClose();
        }
    }, [currentSlideIndex, onPrevStory, onClose]);

    // Timer logic
    useEffect(() => {
        const duration = currentSlide.duration * 1000;

        const animate = (time: number) => {
            if (!startTimeRef.current) startTimeRef.current = time;

            if (!isPaused) {
                const elapsed = time - startTimeRef.current + pausedTimeRef.current;
                const newProgress = Math.min((elapsed / duration) * 100, 100);

                setProgress(newProgress);

                if (elapsed >= duration) {
                    handleNext();
                    return;
                }
            } else {
                // Update start time to keep "elapsed" consistent when resuming
                if (startTimeRef.current) {
                    startTimeRef.current = time - (progress / 100 * duration);
                }
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [currentSlide, handleNext, isPaused, progress]);

    // Reset progress when slide changes
    useEffect(() => {
        setProgress(0);
        pausedTimeRef.current = 0;
        startTimeRef.current = null;
    }, [currentSlideIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handlePrev, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={onClose}
        >
            {/* Mobile-first Container */}
            <div
                className="relative w-full h-full md:w-[400px] md:h-[90vh] md:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Progress Bars */}
                <div className="absolute top-4 left-0 right-0 z-20 flex gap-1 px-2">
                    {story.slides.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full bg-white transition-all duration-0 linear",
                                    idx < currentSlideIndex ? "w-full" :
                                        idx === currentSlideIndex ? "w-0" : "w-0"
                                )}
                                style={{
                                    width: idx < currentSlideIndex ? '100%' :
                                        idx === currentSlideIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-8 left-0 right-0 z-20 flex justify-between items-center px-4 text-white">
                    <div className="flex items-center gap-2">
                        <img src={story.avatar || "http://via.placeholder.com/40"} alt={story.title} className="w-8 h-8 rounded-full border border-white/50" />
                        <span className="font-semibold text-sm drop-shadow-md">{story.title}</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsPaused(!isPaused)}>
                            {isPaused ? <Play className="w-6 h-6 drop-shadow-md" /> : <Pause className="w-6 h-6 drop-shadow-md" />}
                        </button>
                        <button onClick={onClose}>
                            <X className="w-6 h-6 drop-shadow-md" />
                        </button>
                    </div>
                </div>

                {/* Content Layer */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide.id}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipeThreshold = 50;
                            if (offset.x < -swipeThreshold) {
                                handleNext();
                            } else if (offset.x > swipeThreshold) {
                                handlePrev();
                            }
                        }}
                        onTap={(event, info) => {
                            const width = window.innerWidth;
                            // If in a small container (desktop), we should use relative coordinates, 
                            // but for now simpler is fine or we keep the overlay removed?
                            // Wait, I will use a ref for the container to get bounding rect for accurate tap logic.
                        }}
                        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                        style={{ background: currentSlide.background || '#000' }}
                    >
                        {/* Tap Zones embedded in draggable content to allow both */}
                        <div className="absolute inset-y-0 left-0 w-[30%] z-10" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
                        <div className="absolute inset-y-0 right-0 w-[70%] z-10" onClick={(e) => { e.stopPropagation(); handleNext(); }} />

                        {currentSlide.type === 'text' && (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">
                                    {currentSlide.content}
                                </h2>
                            </div>
                        )}

                        {(currentSlide.type === 'image' || currentSlide.type === 'infographic') && (
                            <>
                                <img
                                    src={currentSlide.mediaUrl || currentSlide.content}
                                    alt="Story content"
                                    className="w-full h-full object-cover"
                                />

                                {/* Text Overlay for Image */}
                                {currentSlide.content && currentSlide.mediaUrl && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                                        <p className="text-white text-lg font-medium text-center drop-shadow-md">
                                            {currentSlide.content}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {currentSlide.ctaLink && (
                            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
                                <a
                                    href={currentSlide.ctaLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-gray-200 transition-colors"
                                >
                                    {currentSlide.ctaText || "See More"}
                                </a>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
