# ThermoNeural Design System
## Professional Modern Interface

### Overview
This design system implements a professional, modern aesthetic across all 62 pages of the HVAC-R application. The system prioritizes clean tool interfaces with clear visual hierarchy, optimized readability, and a unified blue/orange color palette designed for accessibility and trust.

### Color Palette

#### Primary Colors
- **Background**: `white` (`#ffffff`) / `slate-950` (`#0f172a`) (dark mode)
- **Foreground**: `slate-950` (`#0f172a`) / `slate-100` (`#f1f5f9`) (dark mode)
- **Primary**: `blue-600` (`#2563eb`)
- **Secondary**: `orange-600` (`#ea580c`)

#### Semantic Colors
- **Success**: `green-600` (`#16a34a`)
- **Warning**: `amber-500` (`#f59e0b`)
- **Error**: `red-600` (`#dc2626`)
- **Info**: `blue-500` (`#3b82f6`)
- **Highlight**: `teal-500` (`#0d9488`)

#### Gradients
- **Primary Gradient**: `from-blue-600 to-orange-600`
- **Background Gradient**: `from-blue-500/10 to-orange-500/10`
- **Selection**: `bg-blue-500/20`

### Typography

#### Font Families
- **Headings**: `font-mono` (JetBrains Mono)
- **Body**: `font-sans` (Inter)
- **UI Elements**: `font-sans` (Inter)

#### Font Sizes
- **H1**: `text-4xl md:text-6xl` (bold, monospace)
- **H2**: `text-3xl md:text-4xl` (bold, monospace)
- **H3**: `text-2xl` (bold, monospace)
- **Body**: `text-base` (regular)
- **Small**: `text-sm` (regular)

#### Font Weights
- **Bold**: `font-bold` (700)
- **Semibold**: `font-semibold` (600)
- **Medium**: `font-medium` (500)
- **Regular**: `font-normal` (400)

### Spacing & Layout

#### Grid System
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Flex**: `flex flex-col md:flex-row gap-4`

#### Spacing Scale
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)

### Components

#### Buttons
```tsx
// Primary Button
<Button className="bg-primary hover:bg-primary/90">

// Secondary Button  
<Button variant="outline" className="border-accent text-accent hover:bg-accent/10">

// Ghost Button
<Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted">
```

#### Cards
```tsx
<Card className="bg-card border-border rounded-xl shadow-lg">
```

#### Inputs
```tsx
<Input className="bg-background border-input focus:border-primary focus:ring-primary/20" />
```

#### Loading States
Use the `PageLoading` component for route transitions:
```tsx
import PageLoading from "@/components/ui/page-loading";

<PageLoading message="Loading Command Interface" />
```

### Animations

#### Framer Motion Presets
```tsx
import { motion } from "framer-motion";

// Fade In
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

// Slide Up  
<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

// Scale In
<motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
```

#### CSS Transitions
- **Default**: `transition-all duration-300`
- **Hover**: `hover:scale-105 hover:shadow-primary/20`
- **Focus**: `focus:ring-2 focus:ring-primary/30`

### Responsive Design

#### Breakpoints
- **sm**: `640px` (mobile)
- **md**: `768px` (tablet)
- **lg**: `1024px` (desktop)
- **xl**: `1280px` (large desktop)

#### Mobile-First Patterns
```tsx
<div className="flex flex-col md:flex-row">
<div className="w-full md:w-1/2">
<div className="text-center md:text-left">
```

### Accessibility Guidelines

#### Color Contrast
- All text meets WCAG AA contrast ratios
- Blue/orange combinations tested for accessibility
- Selection states provide sufficient contrast

#### Keyboard Navigation
- All interactive elements are focusable
- Logical tab order maintained
- Visual focus indicators using `ring-primary`

#### Screen Readers
- Semantic HTML structure
- ARIA labels for complex components
- Alt text for all images

### Performance Guidelines

#### Bundle Optimization
- Lazy loading with `React.lazy()` and `Suspense`
- Route-based code splitting
- Large dependencies identified for optimization:
  - PsychrometricCalculator (1.7MB) - target for dynamic imports
  - PDF generation libraries (390kB) - consider lazy loading
  - Charting libraries (379kB) - evaluate lightweight alternatives

#### Image Optimization
- Use WebP format when possible
- Implement responsive images with `srcset`
- Lazy load images below the fold

### Implementation Examples

#### Page Template
```tsx
export default function PageName() {
  return (
    <div className="min-h-screen bg-slate-950 text-foreground selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl md:text-6xl font-bold font-mono tracking-tight mb-6">
          Page Title
        </h1>
        {/* Content */}
      </div>
    </div>
  );
}
```

#### Component with Loading State
```tsx
import { Suspense } from "react";
import PageLoading from "@/components/ui/page-loading";

export default function Component() {
  return (
    <Suspense fallback={<PageLoading />}>
      {/* Lazy-loaded content */}
    </Suspense>
  );
}
```

### Maintenance & Updates

#### Adding New Pages
1. Apply `bg-slate-950` background
2. Use monospace typography for headings
3. Follow responsive grid patterns
4. Implement lazy loading for heavy components
5. Test color contrast and accessibility

#### Theme Consistency
- Run `grep -r "orange" client/pages` to check for inconsistent colors
- Use Tailwind CSS classes from the defined palette
- Verify all pages use `selection:bg-cyan-500/30`

#### Performance Monitoring
- Regular Lighthouse audits
- Bundle size analysis after adding dependencies
- Mobile responsiveness testing

### Resources
- **Tailwind Config**: `tailwind.config.js`
- **Vite Config**: `vite.config.ts`
- **Component Library**: `client/components/ui/`
- **Icons**: `lucide-react`

---

*Last Updated: 2026-02-08*  
*Version: 2.1 (Futuristic Military)*