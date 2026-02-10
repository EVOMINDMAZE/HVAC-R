# Futuristic Military-Grade AI Design System

## Overview
Comprehensive design system for transforming the HVAC-R application into a futuristic military-grade AI command interface. This system prioritizes data clarity, performance, and user experience with a cohesive aesthetic inspired by advanced military command centers.

## 1. Color Palette

### Core Philosophy
- **Dark Theme Dominance**: Default dark theme for reduced eye strain and enhanced focus
- **Neon Accents**: Strategic use of neon colors for hierarchy, status, and interaction
- **Military-Grade Precision**: Clean, functional color system with clear semantic meaning
- **Accessibility**: WCAG 2.1 AA compliant contrast ratios

### Base Colors
| Color | HSL | Hex | Usage |
|-------|-----|-----|-------|
| **Background** | `222 47% 4%` | `#05070d` | Primary background surface |
| **Foreground** | `210 40% 98%` | `#f1f5f9` | Primary text and icons |
| **Card** | `222 47% 8%` | `#0c0f19` | Card and panel backgrounds |
| **Muted** | `222 47% 15%` | `#1a1f2e` | Subtle backgrounds, disabled states |
| **Border** | `222 47% 20%` | `#252b3d` | Borders, dividers, separators |

### Neon Accent Colors
| Color | Name | HSL | Hex | Usage |
|-------|------|-----|-----|-------|
| **Neon Cyan** | Primary | `180 100% 50%` | `#00ffff` | Primary actions, main CTAs, active states |
| **Neon Green** | Success | `145 100% 50%` | `#00ff80` | Success states, positive metrics, confirmations |
| **Neon Orange** | Warning | `45 100% 50%` | `#ffcc00` | Warnings, attention-needed, medium priority |
| **Neon Red** | Destructive | `0 100% 50%` | `#ff0000` | Errors, destructive actions, critical alerts |
| **Neon Purple** | Highlight | `285 100% 60%` | `#b300ff` | Highlights, special features, premium indicators |
| **Neon Blue** | Information | `210 100% 60%` | `#0080ff` | Informational states, links, secondary actions |

### Semantic Color Mapping
```css
/* Light Theme (Optional) */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 4%;
  --primary: 180 100% 45%;
  --success: 145 100% 40%;
  --warning: 45 100% 45%;
  --destructive: 0 100% 45%;
  --highlight: 285 100% 50%;
  --info: 210 100% 50%;
}

/* Dark Theme (Default) */
.dark {
  --background: 222 47% 4%;
  --foreground: 210 40% 98%;
  --primary: 180 100% 50%;
  --success: 145 100% 50%;
  --warning: 45 100% 50%;
  --destructive: 0 100% 50%;
  --highlight: 285 100% 60%;
  --info: 210 100% 60%;
}
```

### Glassmorphism Effects
| Effect | Properties | Usage |
|--------|------------|-------|
| **Glass Panel** | `backdrop-filter: blur(12px); background: rgba(5, 7, 13, 0.7); border: 1px solid rgba(0, 255, 255, 0.1);` | Cards, modals, overlays |
| **Glass Border** | `border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 0 20px rgba(0, 255, 255, 0.05);` | Interactive elements |
| **Neon Glow** | `box-shadow: 0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.1);` | Active states, focus |
| **Holographic** | `background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(180, 0, 255, 0.1));` | Special indicators |

### Color Usage Guidelines
1. **Primary Actions**: Use Neon Cyan for primary buttons, main navigation, key CTAs
2. **Status Indicators**: 
   - Green: Success, online, completed
   - Orange: Warning, pending, attention required
   - Red: Error, offline, critical
   - Purple: Premium, special, featured
3. **Data Visualization**: Consistent color coding across charts and graphs
4. **Accessibility**: Ensure minimum contrast ratio of 4.5:1 for text, 3:1 for UI components
5. **Dark Mode First**: Design for dark theme with optional light theme support

## 2. Typography System

### Font Family
- **Primary**: `'Roboto Mono'` or `'SF Mono'` - Monospace for data, code, technical information
- **Secondary**: `'Inter'` or `'SF Pro Display'` - Sans-serif for UI text, labels, descriptions
- **Fallback**: System monospace and sans-serif stack

### Type Scale
| Scale | Size (rem) | Size (px) | Weight | Use Case |
|-------|------------|-----------|--------|----------|
| **H1** | 3.5rem | 56px | 700 | Page titles, major headings |
| **H2** | 2.5rem | 40px | 700 | Section headings |
| **H3** | 2rem | 32px | 600 | Subsection headings |
| **H4** | 1.5rem | 24px | 600 | Card titles, panel headers |
| **H5** | 1.25rem | 20px | 500 | Small headers, labels |
| **H6** | 1rem | 16px | 500 | Minor headers |
| **Body Large** | 1.125rem | 18px | 400 | Primary body text |
| **Body** | 1rem | 16px | 400 | Standard body text |
| **Body Small** | 0.875rem | 14px | 400 | Secondary text, captions |
| **Caption** | 0.75rem | 12px | 400 | Metadata, tiny labels |

### Typography Guidelines
1. **Hierarchy**: Clear visual hierarchy using size, weight, and color
2. **Monospace for Data**: Use monospace font for numerical data, code, technical information
3. **Line Height**: 1.5 for body text, 1.2 for headings
4. **Letter Spacing**: 0.01em for body, 0.02em for uppercase labels
5. **Accessibility**: Minimum font size of 12px, responsive scaling

## 3. UI Components

### Buttons
| Type | Style | Usage |
|------|-------|-------|
| **Primary** | Neon cyan background, dark text, glow effect | Main CTAs, primary actions |
| **Secondary** | Transparent with neon cyan border, hover glow | Secondary actions, alternatives |
| **Tertiary** | Text-only with underline on hover | Tertiary actions, less important |
| **Destructive** | Neon red background, appropriate warning styling | Delete, remove, destructive actions |
| **Success** | Neon green background | Confirm, approve, positive actions |
| **Icon Button** | Square, icon-centered, minimal border | Toolbar actions, compact spaces |

### Cards & Panels
| Type | Style | Usage |
|------|-------|-------|
| **Glass Card** | Glassmorphism effect, subtle border, rounded corners | Data cards, content containers |
| **Data Panel** | Dark background, neon accent border, compact spacing | Metric displays, KPI panels |
| **Command Panel** | Elevated, with status indicators, interactive | Dashboard widgets, control panels |
| **Modal/Overlay** | Glass background with blur, centered, focused | Dialogs, overlays, detailed views |

### Inputs & Forms
| Type | Style | Usage |
|------|-------|-------|
| **Text Input** | Dark background, neon cyan border on focus, clear labels | Text entry, search, forms |
| **Select** | Consistent with text input, dropdown with glass panel | Selection, dropdowns |
| **Checkbox/Radio** | Custom neon-styled, animated transitions | Options, toggles |
| **Slider** | Neon track, glow effect on thumb | Range selection, adjustments |
| **Toggle Switch** | Neon cyan when active, smooth animation | Binary switches, settings |

### Data Visualization
| Type | Style | Usage |
|------|-------|-------|
| **Charts** | Dark background, neon color palette, minimal grid lines | Data charts, graphs |
| **Metrics** | Large monospace numbers, clear labels, trend indicators | KPI displays, statistics |
| **Progress Bars** | Neon cyan fill, glass background, animated | Progress indicators, loading |
| **Status Indicators** | Colored dots with glow, clear labels | System status, alerts |

## 4. Animation Guidelines

### Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Fast**: Animations should be quick (200-300ms) to not delay interaction
3. **Smooth**: Use easing curves for natural motion
4. **Consistent**: Same animation patterns across the application

### Animation Types
| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| **Fade In** | 200ms | ease-out | Element appearance, page transitions |
| **Slide Up** | 300ms | ease-out | Modal appearance, card entry |
| **Scale In** | 200ms | ease-out | Button presses, interactive feedback |
| **Neon Pulse** | 1.5s | ease-in-out | Attention drawing, status alerts |
| **Glow Hover** | 150ms | ease-out | Interactive element hover states |
| **Loading Spinner** | 1s | linear | Loading states, progress |

### Micro-interactions
1. **Button Press**: Scale down 95%, quick return
2. **Card Hover**: Slight lift (translateY -2px), subtle glow
3. **Input Focus**: Border glow, label animation
4. **Success Feedback**: Quick green pulse, checkmark animation
5. **Error Feedback**: Red shake, attention pulse

## 5. Layout & Grid System

### Breakpoints
| Size | Prefix | Min Width | Usage |
|------|--------|-----------|-------|
| **Mobile** | `sm` | 640px | Small screens, phones |
| **Tablet** | `md` | 768px | Medium screens, tablets |
| **Desktop** | `lg` | 1024px | Large screens, desktops |
| **Wide** | `xl` | 1280px | Extra large screens |
| **Ultra Wide** | `2xl` | 1536px | Large monitors |

### Grid System
- **Base**: 8px spacing unit (0.5rem)
- **Columns**: 12-column responsive grid
- **Gutters**: 16px (1rem) between columns
- **Containers**: Max-width 1280px for content, full-width for hero sections

### Spacing Scale
| Scale | Value (rem) | Value (px) | Usage |
|-------|-------------|------------|-------|
| **xs** | 0.25rem | 4px | Tight spacing, icon padding |
| **sm** | 0.5rem | 8px | Small spacing, compact layouts |
| **md** | 1rem | 16px | Default spacing, component padding |
| **lg** | 1.5rem | 24px | Section spacing, larger gaps |
| **xl** | 2rem | 32px | Major section separation |
| **2xl** | 3rem | 48px | Page-level spacing |

## 6. Icons & Imagery

### Icon System
- **Library**: Lucide React for consistency
- **Style**: Outline style with occasional fill for active states
- **Sizing**: 16px, 20px, 24px, 32px standard sizes
- **Color**: Use semantic colors (foreground, primary, etc.)

### Imagery Guidelines
1. **Optimization**: WebP/AVIF format, lazy loading
2. **Style**: Dark theme optimized, minimal decorative imagery
3. **Placeholders**: Geometric patterns or gradient placeholders
4. **Illustrations**: Futuristic, technical, data-focused when needed

## 7. Effects & Shadows

### Shadow System
| Elevation | Properties | Usage |
|-----------|------------|-------|
| **Low** | `0 2px 4px rgba(0, 0, 0, 0.1)` | Cards, subtle elevation |
| **Medium** | `0 4px 8px rgba(0, 0, 0, 0.15)` | Modals, raised panels |
| **High** | `0 8px 16px rgba(0, 0, 0, 0.2)` | Popovers, dropdowns |
| **Neon Glow** | `0 0 20px rgba(0, 255, 255, 0.3)` | Active states, focus |

### Special Effects
1. **Glassmorphism**: `backdrop-filter: blur(12px); background: rgba(5, 7, 13, 0.7);`
2. **Neon Border**: `border: 1px solid rgba(0, 255, 255, 0.3); box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);`
3. **Holographic Gradient**: `background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(180, 0, 255, 0.1));`
4. **Scan Line**: Subtle moving scan line effect for loading states

## 8. Implementation Notes

### CSS Variables
Update `global.css` with extended color palette and new design tokens.

### Component Library
Create reusable React components implementing this design system.

### Theme Provider
Ensure theme consistency across light/dark modes.

### Accessibility
All components must meet WCAG 2.1 AA standards.

## 9. Examples & References

### Page Templates
1. **Landing Page**: Hero with neon typography, glass cards, animated data visualization
2. **Dashboard**: Command-center layout, consolidated data panels, status indicators
3. **Tool Interface**: Progressive disclosure, guided workflow, focused visualization
4. **Authentication**: Secure access panel, biometric visualization, clear feedback

### Component Examples
See `client/components/ui` for existing shadcn/ui components to be extended.

---

**Last Updated**: 2026-02-08  
**Version**: 1.0  
**Status**: Draft - Implementation Phase 2