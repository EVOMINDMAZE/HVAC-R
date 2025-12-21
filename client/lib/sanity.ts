import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { useState, useEffect } from "react";

// --- Sanity Configuration ---
export const sanityClient = createClient({
    projectId: import.meta.env.VITE_SANITY_PROJECT_ID || "0bspr1lk",
    dataset: import.meta.env.VITE_SANITY_DATASET || "production",
    useCdn: true, // true for production to cache data
    apiVersion: "2023-05-03",
});

// Image Builder Hook
const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
    if (!source) return "";
    return builder.image(source).url();
}

// --- Types ---
export interface SanityPost {
    _id: string;
    title: string;
    slug: { current: string };
    mainImage: any;
    publishedAt: string;
    excerpt: string;
    body: string; // Markdown Content
    author: {
        name: string;
        image: any;
    };
    categories: Array<{
        title: string;
    }>;
}

export interface SanityWebStory {
    _id: string;
    title: string;
    slug: { current: string };
    coverImage: any;
    slides: Array<{
        type: 'image' | 'text' | 'infographic';
        duration: number;
        content?: string; // For text slides
        image?: any;      // For image slides
        link?: string;
        ctaText?: string;
    }>;
    author?: {
        name: string;
        image?: any;
    };
}

// --- Hooks ---

// Hook for fetching Blog Posts
export function useSanityPosts() {
    const [posts, setPosts] = useState<SanityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const query = `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      body,
      mainImage,
      "author": author->{name, image},
      "categories": categories[]->{title}
    }`;

        sanityClient
            .fetch(query)
            .then((data) => {
                setPosts(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Sanity Fetch Error:", err);
                setError("Failed to load content.");
                setLoading(false);
            });
    }, []);

    return { posts, loading, error };
}

// Hook for fetching Single Post by Slug
export function useSanityPost(slug: string | undefined) {
    const [post, setPost] = useState<SanityPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const query = `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      body,
      mainImage,
      "author": author->{name, image},
      "categories": categories[]->{title}
    }`;

        sanityClient
            .fetch(query, { slug })
            .then((data) => {
                setPost(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Sanity Single Post Fetch Error:", err);
                setError("Failed to load post.");
                setLoading(false);
            });
    }, [slug]);

    return { post, loading, error };
}


// Hook for fetching Web Stories
export function useSanityWebStories() {
    const [stories, setStories] = useState<SanityWebStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const query = `*[_type == "webStory"] | order(_createdAt desc) {
      _id,
      title,
      slug,
      coverImage,
      "author": author->{name, image},
      slides[] {
        type,
        duration,
        content,
        image,
        link,
        ctaText
      }
    }`;

        sanityClient
            .fetch(query)
            .then((data) => {
                setStories(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Sanity Story Fetch Error:", err);
                setError("Failed to load stories.");
                setLoading(false);
            });
    }, []);

    return { stories, loading, error };
}

// --- Helpers to match old Wordpress Interface for easy migration ---

export const getSanityImageUrl = (imageSource: any) => {
    if (!imageSource) return "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=3540";
    return urlFor(imageSource);
};

export const getAuthorName = (post: SanityPost | SanityWebStory) => {
    return post.author?.name || "ThermoNeural Team";
};

export const getCategory = (post: SanityPost) => {
    return post.categories?.[0]?.title || "Article";
};
