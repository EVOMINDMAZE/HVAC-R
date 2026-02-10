import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Play, AlertTriangle } from "lucide-react";
import {
  useSanityWebStories,
  getSanityImageUrl,
  getAuthorName,
  SanityWebStory,
} from "@/lib/sanity";
import { SanityStoryViewer } from "@/components/web-stories/SanityStoryViewer";
import { SEO } from "@/components/SEO";

export function WebStories() {
  const { stories, loading, error } = useSanityWebStories();
  const [selectedStory, setSelectedStory] = useState<SanityWebStory | null>(null);

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />

      <main className="pt-24 pb-20">
        <SEO
          title="Stories"
          description="Visual HVAC&R stories and quick technical guides from ThermoNeural."
        />

        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Stories</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold">
              Short visual guides for HVAC&R teams.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Tap into bite-sized stories on troubleshooting, refrigerant trends, and field tips.
            </p>
          </div>
        </section>

        <section className="px-4">
          <div className="max-w-6xl mx-auto">
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="aspect-[3/5] rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-2xl border border-border/50">
                <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-warning" />
                <h3 className="text-lg font-medium mb-2">
                  Could not load stories
                </h3>
                <p>Please try again later.</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {stories.map((story) => (
                  <button
                    key={story._id}
                    onClick={() => setSelectedStory(story)}
                    className="group text-left"
                  >
                    <div className="relative aspect-[3/5] rounded-2xl overflow-hidden border border-border/60">
                      <img
                        src={getSanityImageUrl(story.coverImage)}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
                          <Play className="h-3 w-3" />
                          Story
                        </div>
                        <p className="mt-2 text-sm font-semibold">{story.title}</p>
                        <p className="text-xs text-white/70">{getAuthorName(story)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {selectedStory && (
          <SanityStoryViewer
            story={selectedStory}
            onClose={() => setSelectedStory(null)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
