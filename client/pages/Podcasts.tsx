import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchPodcastsFromRSS, PodcastEpisode } from "@/data/podcasts";
import { Play, Pause, Clock, Calendar, Headphones, Mic, ArrowLeft, MoreHorizontal, Heart, Share2, Loader2, Volume2, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function Podcasts() {
    const [podcasts, setPodcasts] = useState<PodcastEpisode[]>([]);
    const [activePodcast, setActivePodcast] = useState<PodcastEpisode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [likedEpisodes, setLikedEpisodes] = useState<Set<string>>(new Set());

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadPodcasts() {
            try {
                const data = await fetchPodcastsFromRSS();
                setPodcasts(data);
                if (data.length > 0) setActivePodcast(data[0]);
            } catch (error) {
                console.error("Failed to load podcasts", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPodcasts();

        // Load liked episodes from local storage
        const savedLikes = localStorage.getItem("likedPodcasts");
        if (savedLikes) {
            setLikedEpisodes(new Set(JSON.parse(savedLikes)));
        }
    }, []);

    // Handle Audio Playback
    useEffect(() => {
        if (activePodcast && audioRef.current) {
            audioRef.current.src = activePodcast.audioUrl || "";
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback error:", e));
            }
        }
    }, [activePodcast]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => {
                    console.error("Play failed:", e);
                    setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const time = Number(e.target.value);
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    };

    const toggleLike = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newLikes = new Set(likedEpisodes);
        if (newLikes.has(id)) {
            newLikes.delete(id);
        } else {
            newLikes.add(id);
        }
        setLikedEpisodes(newLikes);
        localStorage.setItem("likedPodcasts", JSON.stringify(Array.from(newLikes)));
    };

    const handleShare = async (podcast: PodcastEpisode, e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: podcast.title,
                    text: `Check out this podcast: ${podcast.title}`,
                    url: podcast.audioUrl || window.location.href,
                });
            } catch (err) {
                console.log("Error sharing:", err);
            }
        } else {
            // Fallback for browsers without Web Share API
            navigator.clipboard.writeText(podcast.audioUrl || window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20 pt-24 px-4 md:px-8 relative overflow-hidden font-sans">
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={handleTimeUpdate}
            />

            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-emerald-900/10 via-blue-900/5 to-transparent pointer-events-none" />
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-16 relative z-10">

                {/* Header & Navigation */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/dashboard')}
                        className="absolute left-0 top-0 md:static p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all group"
                    >
                        <ArrowLeft size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                    </motion.button>

                    <div className="flex-1 md:pl-8 text-center md:text-left">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold tracking-tight mb-3"
                        >
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                                Sonic HVAC
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-400 text-lg max-w-2xl"
                        >
                            Deep dives into thermal flows, system architecture, and industry legends.
                        </motion.p>
                    </div>
                </div>

                {/* Active Player - Hero Section */}
                <AnimatePresence mode="wait">
                    {activePodcast ? (
                        <motion.div
                            key={activePodcast.id}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden group"
                        >
                            {/* Glow Effect */}
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-500/5 to-blue-500/5 pointer-events-none" />

                            <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                                {/* Album Art */}
                                <div className="w-full md:w-72 aspect-square rounded-2xl overflow-hidden shadow-2xl relative flex-shrink-0 group-hover:shadow-emerald-500/20 transition-shadow duration-500">
                                    <img src={activePodcast.coverImage} alt={activePodcast.title} className="w-full h-full object-cover" />
                                </div>

                                {/* Player Controls & Info */}
                                <div className="flex-1 space-y-6 text-center md:text-left w-full h-full flex flex-col justify-center">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                                            {isPlaying && (
                                                <div className="flex gap-1 items-end h-3">
                                                    <span className="w-1 h-3 bg-emerald-400 animate-[bounce_1s_infinite]" />
                                                    <span className="w-1 h-2 bg-emerald-400 animate-[bounce_1.2s_infinite]" />
                                                    <span className="w-1 h-3 bg-emerald-400 animate-[bounce_0.8s_infinite]" />
                                                </div>
                                            )}
                                            {isPlaying ? "Now Playing" : "Paused"}
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-bold leading-tight">{activePodcast.title}</h2>
                                        <div className="text-lg text-gray-300 line-clamp-2 md:line-clamp-1">
                                            {activePodcast.description}
                                        </div>
                                    </div>

                                    {/* Interactive Progress Bar */}
                                    <div className="space-y-2 group/progress">
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 100}
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="w-full h-1.5 bg-zinc-700/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 group-hover/progress:[&::-webkit-slider-thumb]:opacity-100 transition-all [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:rounded-full"
                                            style={{
                                                backgroundImage: `linear-gradient(to right, #10b981 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) ${(currentTime / duration) * 100}%)`
                                            }}
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center justify-center md:justify-normal gap-6 pt-2">
                                        <button
                                            onClick={(e) => handleShare(activePodcast, e)}
                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Share2 size={20} />
                                        </button>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 15 }}
                                                className="hidden md:block p-2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <SkipBack size={24} />
                                            </button>

                                            <button
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition hover:bg-emerald-50 shadow-lg shadow-white/10"
                                            >
                                                {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
                                            </button>

                                            <button
                                                onClick={() => { if (audioRef.current) audioRef.current.currentTime += 15 }}
                                                className="hidden md:block p-2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <SkipForward size={24} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={(e) => toggleLike(activePodcast.id, e)}
                                            className={cn("p-2 transition-colors", likedEpisodes.has(activePodcast.id) ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-400")}
                                        >
                                            <Heart size={20} className={likedEpisodes.has(activePodcast.id) ? "fill-current" : ""} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 text-gray-500">
                            <div className="text-center space-y-2">
                                <Headphones size={48} className="mx-auto opacity-50 mb-4" />
                                <p>Select an episode to start listening</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Episodes List / Grid */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full" />
                        Latest Episodes
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            <div className="col-span-3 flex justify-center py-20 text-gray-500">
                                <Loader2 className="animate-spin w-8 h-8" />
                            </div>
                        ) : podcasts.map((podcast, index) => (
                            <motion.div
                                key={podcast.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 + 0.2 }}
                                onClick={() => {
                                    setActivePodcast(podcast);
                                    setIsPlaying(true);
                                }}
                                className={cn(
                                    "group relative bg-zinc-900/50 hover:bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/10",
                                    activePodcast?.id === podcast.id ? "ring-1 ring-emerald-500/50 bg-emerald-900/10" : ""
                                )}
                            >
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative shadow-lg">
                                        <img src={podcast.coverImage} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                                <Play className="w-4 h-4 fill-white text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <h4 className="font-bold text-base leading-snug text-gray-100 group-hover:text-emerald-400 transition-colors line-clamp-2 mb-1">
                                                {podcast.title}
                                            </h4>
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <Mic size={10} /> {podcast.host}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 text-xs text-gray-400 font-medium">
                                            <div className="flex gap-3">
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5">
                                                    <Calendar size={10} /> {podcast.publishedDate}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} /> {podcast.duration}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="hover:text-white transition-colors p-1"
                                                    onClick={(e) => toggleLike(podcast.id, e)}
                                                >
                                                    <Heart size={14} className={cn(likedEpisodes.has(podcast.id) ? "fill-red-500 text-red-500" : "")} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

