
export interface PodcastEpisode {
    id: string;
    title: string;
    description: string;
    host: string;
    duration: string;
    coverImage: string;
    audioUrl?: string; // Mock URL or placeholder
    publishedDate: string;
    tags: string[];
}


export interface PodcastEpisode {
    id: string;
    title: string;
    description: string;
    host: string;
    duration: string;
    coverImage: string;
    audioUrl?: string;
    publishedDate: string;
    tags: string[];
}

const RSS_URL = 'https://anchor.fm/s/10d033af0/podcast/rss';

export async function fetchPodcastsFromRSS(): Promise<PodcastEpisode[]> {
    try {
        const response = await fetch(RSS_URL);
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");

        const items = Array.from(xml.querySelectorAll("item"));
        const channelImage = xml.querySelector("channel > image > url")?.textContent ||
            xml.querySelector("channel > itunes\\:image, image")?.getAttribute("href") || "";

        return items.map((item, index) => {
            const title = item.querySelector("title")?.textContent || "Untitled Episode";
            // Strip HTML from description
            const rawDescription = item.querySelector("description")?.textContent || "";
            const description = rawDescription.replace(/<[^>]*>/g, '').slice(0, 200) + (rawDescription.length > 200 ? '...' : '');

            const audioUrl = item.querySelector("enclosure")?.getAttribute("url") || "";
            const pubDate = item.querySelector("pubDate")?.textContent || "";
            const formattedDate = pubDate ? new Date(pubDate).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
            }) : "";

            const durationSec = item.querySelector("itunes\\:duration, duration")?.textContent || "0";
            // Format duration if needed (some feeds assume seconds, some MM:SS)
            const duration = durationSec.includes(':') ? durationSec : `${Math.floor(parseInt(durationSec) / 60)} min`;

            const episodeImage = item.querySelector("itunes\\:image, image")?.getAttribute("href") || channelImage;

            return {
                id: `rss-${index}`,
                title,
                description,
                host: "HVAC R", // Default host or parse from 'itunes:author'
                duration,
                coverImage: episodeImage || "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&auto=format&fit=crop&q=60",
                audioUrl,
                publishedDate: formattedDate,
                tags: ["Podcast", "HVAC"]
            };
        });
    } catch (error) {
        console.error("Error fetching podcast RSS:", error);
        return [];
    }
}

