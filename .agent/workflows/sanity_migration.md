---
description: Migration guide for switching from WordPress to Sanity CMS for managing Blog and Web Stories content content.
---

# Sanity Migration Todo List

This plan outlines the steps to migrate the content management system from a planned WordPress integration to Sanity.io. This will enable a free, serverless, and highly customizable content backend properly integrated into the React application.

- [ ] **1. Initialize Sanity Project**
    - [ ] Create a new Sanity project in a `studio` subdirectory using `npm create sanity@latest`.
    - [ ] Configure the project (Clean project with no predefined schema is usually best for custom needs).
    - [ ] **User Action Required:** User will need to run the init command and log in to Sanity.

- [ ] **2. Install Sanity Client**
    - [ ] Install `@sanity/client` and `@sanity/image-url` in the main React application (`client` folder).
    - [ ] `npm install @sanity/client @sanity/image-url`

- [ ] **3. Define Content Schemas (in `studio`)**
    - [ ] Create `post.ts` schema for Blog Posts (title, slug, mainImage, categories, publishedAt, body, author).
    - [ ] Create `author.ts` schema (name, slug, image, bio).
    - [ ] Create `category.ts` schema (title, description).
    - [ ] Create `webStory.ts` schema (title, slug, coverImage, slides array).
    - [ ] Define `storySlide` object type (type: 'image'|'text', content, duration, link).

- [ ] **4. Create Sanity Service Layer**
    - [ ] Create `client/lib/sanity.ts` to replace `client/lib/wordpress.ts`.
    - [ ] Implement `sanityClient` configuration using Environment Variables.
    - [ ] Implement `useSanityPosts` hook matching the interface of the old WP hook.
    - [ ] Implement `useSanityWebStories` hook matching the interface of the old WP hook.
    - [ ] Add helper functions: `urlFor` (image builder).

- [ ] **5. Update Blog Page (`client/pages/Blog.tsx`)**
    - [ ] Replace `useWPPosts` import with `useSanityPosts`.
    - [ ] Update data accessors (Sanity returns slightly different JSON structure than WP).
    - [ ] Replace `dangerouslySetInnerHTML` with Portable Text renderer (safer and cleaner).

- [ ] **6. Update Web Stories Page (`client/pages/WebStories.tsx`)**
    - [ ] Replace `useWPWebStories` import with `useSanityWebStories`.
    - [ ] Update `WPStoryViewer` to `SanityStoryViewer` (since we are custom building the viewer now, we no longer use an iFrame to WP).
    - [ ] Update the `StoryViewer` component to render slides from Sanity JSON data instead of the WP Iframe.

- [ ] **7. Cleanup**
    - [ ] Remove `client/lib/wordpress.ts`.
    - [ ] Remove `WPStoryViewer.tsx`.
    - [ ] Update `.env` with `VITE_SANITY_PROJECT_ID` and `VITE_SANITY_DATASET`.
