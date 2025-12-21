import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'webStory',
    title: 'Web Story',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
        }),
        defineField({
            name: 'coverImage',
            title: 'Cover Image',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: { type: 'author' },
        }),
        defineField({
            name: 'slides',
            title: 'Slides',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'slide',
                    fields: [
                        { name: 'type', title: 'Type', type: 'string', options: { list: ['image', 'text', 'infographic'] } },
                        { name: 'duration', title: 'Duration (seconds)', type: 'number', initialValue: 5 },
                        { name: 'image', title: 'Slide Image', type: 'image', options: { hotspot: true } },
                        { name: 'content', title: 'Text Content', type: 'text' },
                        { name: 'link', title: 'Swipe Up Link', type: 'url' },
                        { name: 'ctaText', title: 'CTA Text', type: 'string' },
                    ]
                }
            ]
        }),
    ],
})
