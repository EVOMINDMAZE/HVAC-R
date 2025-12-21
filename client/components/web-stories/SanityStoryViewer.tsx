import { useRef, useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ArrowUpLeft, Heart, Share2, MoreVertical, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SanityWebStory, getSanityImageUrl } from "@/lib/sanity";

interface SanityStoryViewerProps {
    story: SanityWebStory;
    onClose: () => void;
}

export function SanityStoryViewer({ story, onClose }: SanityStoryViewerProps) {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const totalSlides = story.slides.length;
    // Use a ref to store the timer so we can clear it reliably
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentSlide = story.slides[currentSlideIndex];
    const slideDuration = (currentSlide.duration || 5) * 1000; // ms

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === " ") setIsPaused(prev => !prev);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentSlideIndex]);

    // Prevent scroll when open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    // Timer logic for auto-advance
    useEffect(() => {
        if (isPaused) return;

        const intervalTime = 50; // Update every 50ms for smooth progress
        const increment = (intervalTime / slideDuration) * 100;

        timerRef.current = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + increment;
            });
        }, intervalTime);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentSlideIndex, isPaused]);

    const handleNext = () => {
        if (currentSlideIndex < totalSlides - 1) {
            setCurrentSlideIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose(); // Close on last slide
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-0 md:p-4 backdrop-blur-sm"
        >
            {/* Container simulating mobile frame on desktop */}
            <div className="relative w-full h-full md:w-[400px] md:h-[80vh] md:max-h-[850px] bg-black md:rounded-2xl overflow-hidden shadow-2xl border border-white/10">

                {/* --- Progress Bar --- */}
                <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2">
                    {story.slides.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all ease-linear"
                                style={{
                                    width: idx === currentSlideIndex ? `${progress}%` : idx < currentSlideIndex ? '100%' : '0%',
                                    transitionDuration: idx === currentSlideIndex ? '50ms' : '0ms'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Header Controls --- */}
                <div className="absolute top-4 left-0 right-0 z-30 px-4 flex justify-between items-center text-white mt-4">
                    {/* Author Info */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/50">
                            <img src={getSanityImageUrl(story.author?.image)} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-semibold drop-shadow-md">{story.author?.name || "ThermoNeural"}</span>
                        <span className="text-white/60 text-xs">• {Math.ceil((Date.now() - new Date(story.title).getTime()) / (1000 * 60 * 60 * 24))}d</span>
                        {/* Note: In real app use createdAt for date */}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsPaused(!isPaused)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            {isPaused ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* --- Tap Zones --- */}
                <div className="absolute inset-0 z-20 flex">
                    <div className="w-1/3 h-full" onClick={handlePrev} />
                    <div className="w-1/3 h-full" onClick={() => setIsPaused(!isPaused)} />
                    <div className="w-1/3 h-full" onClick={handleNext} />
                </div>

                {/* --- Slide Content --- */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlideIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-10"
                    >
                        {/* Background Image */}
                        {currentSlide.image && (
                            <img
                                src={getSanityImageUrl(currentSlide.image)}
                                alt="Slide"
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

                        {/* Text Content */}
                        <div className="absolute bottom-20 left-0 right-0 p-8 text-center text-white pb-32">
                            {currentSlide.content && (
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-2xl font-bold leading-relaxed drop-shadow-lg"
                                >
                                    {currentSlide.content}
                                </motion.p>
                            )}

                            {/* CTA Button */}
                            {currentSlide.link && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mt-8"
                                >
                                    <div className="inline-flex flex-col items-center animate-bounce">
                                        <span className="text-xs uppercase tracking-widest mb-2 font-semibold">Swipe Up</span>
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50">
                                            <ArrowUpLeft className="rotate-45" size={20} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* --- Bottom Actions Footer --- */}
                <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-center text-white pb-8">
                    <div className="flex items-center gap-4 w-full">
                        <div className="relative flex-grow h-12 bg-white/10 rounded-full border border-white/20 flex items-center px-4">
                            <span className="text-white/60 text-sm">Send message...</span>
                        </div>
                        <button className="p-2">
                            <Heart size={28} className="text-white hover:text-red-500 transition-colors" />
                        </button>
                        <button className="p-2">
                            <Share2 size={26} className="text-white" />
                        </button>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
