export type StoryType = 'image' | 'video' | 'text' | 'infographic';

export interface StorySlide {
    id: string;
    type: StoryType;
    content: string; // Text content or Image URL
    mediaUrl?: string; // Optional for text overlay on image
    duration: number; // in seconds
    background?: string;
    ctaLink?: string;
    ctaText?: string;
}

export interface Story {
    id: string;
    title: string;
    avatar: string;
    slides: StorySlide[];
}

export const STORIES_DATA: Story[] = [
    {
        id: 'ai-hvac',
        title: 'AI in HVAC',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=hvac',
        slides: [
            {
                id: '1',
                type: 'text',
                content: 'How AI is revolutionizing HVAC efficiency. 🤖❄️',
                background: 'linear-gradient(45deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
                duration: 5
            },
            {
                id: '2',
                type: 'image',
                content: 'AI-driven predictive maintenance can reduce downtime by up to 50%.',
                mediaUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
                duration: 6
            },
            {
                id: '3',
                type: 'infographic',
                content: 'Smart thermostats learn your habits to save energy.',
                mediaUrl: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800&auto=format&fit=crop&q=60',
                duration: 5
            }
        ]
    },
    {
        id: 'cryogenics',
        title: 'Cryogenics Future',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=cryo',
        slides: [
            {
                id: 'c1',
                type: 'text',
                content: 'Deep freeze: The future of Cryogenics 🧊',
                background: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
                duration: 4
            },
            {
                id: 'c2',
                type: 'image',
                content: 'Quantum computing requires temperatures near absolute zero.',
                mediaUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60',
                duration: 6
            }
        ]
    },
    {
        id: 'quantum-cooling',
        title: 'Quantum Cooling',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=quantum',
        slides: [
            {
                id: 'q1',
                type: 'text',
                content: 'What is Quantum Cooling? ⚛️',
                background: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
                duration: 5
            },
            {
                id: 'q2',
                type: 'text',
                content: 'Laser cooling atoms to slow them down...',
                background: 'black',
                duration: 5
            }
        ]
    }
];
