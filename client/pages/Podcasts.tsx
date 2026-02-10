import { useState, useEffect, useRef } from "react";
import { fetchPodcastsFromRSS, PodcastEpisode } from "@/data/podcasts";
import {
  Play,
  Pause,
  Clock,
  Calendar,
  Headphones,
  Loader2,
  Volume2,
  SkipBack,
  SkipForward,
  Heart,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";

export function Podcasts() {
  const [podcasts, setPodcasts] = useState<PodcastEpisode[]>([]);
  const [activePodcast, setActivePodcast] = useState<PodcastEpisode | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [likedEpisodes, setLikedEpisodes] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    const savedLikes = localStorage.getItem("likedPodcasts");
    if (savedLikes) {
      setLikedEpisodes(new Set(JSON.parse(savedLikes)));
    }
  }, []);

  useEffect(() => {
    if (activePodcast && audioRef.current) {
      audioRef.current.src = activePodcast.audioUrl || "";
      if (isPlaying) {
        audioRef.current
          .play()
          .catch((e) => console.error("Playback error:", e));
      }
    }
  }, [activePodcast]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
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
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
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
    const shareUrl =
      podcast.audioUrl || `${window.location.origin}/podcasts#${podcast.id}`;

    if (navigator.share) {
      await navigator.share({
        title: podcast.title,
        text: podcast.description,
        url: shareUrl,
      });
    }
  };

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />

      <main className="pt-24 pb-20">
        <SEO
          title="Podcasts"
          description="Audio briefings for HVAC&R, refrigeration, and cryogenic engineering teams."
        />

        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Podcast</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold">
              Short audio briefings for HVAC&R leaders.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Hear from operators, engineers, and compliance experts on the decisions that shape modern refrigeration.
            </p>
          </div>
        </section>

        <section className="px-4">
          <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {isLoading && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading episodes...
                </div>
              )}

              {!isLoading && podcasts.length === 0 && (
                <Card className="border-border/60">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    No episodes available right now.
                  </CardContent>
                </Card>
              )}

              {podcasts.map((podcast) => (
                <Card
                  key={podcast.id}
                  className={cn(
                    "border-border/60 cursor-pointer",
                    activePodcast?.id === podcast.id && "border-primary",
                  )}
                  onClick={() => setActivePodcast(podcast)}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
                      <Headphones className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {podcast.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {podcast.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {podcast.publishedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {podcast.duration || ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        className="text-muted-foreground hover:text-primary"
                        onClick={(e) => toggleLike(podcast.id, e)}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            likedEpisodes.has(podcast.id) && "fill-primary text-primary",
                          )}
                        />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-primary"
                        onClick={(e) => handleShare(podcast, e)}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border/60 h-fit">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {activePodcast?.title || "Episode"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {activePodcast?.description || "Select an episode to start listening."}
                </p>

                <audio
                  ref={audioRef}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />

                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentTime(Math.max(currentTime - 15, 0))}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setIsPlaying((prev) => !prev)}>
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentTime(Math.min(currentTime + 15, duration))}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Volume2 className="h-4 w-4" />
                    {activePodcast?.duration || ""}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
