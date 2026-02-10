import fs from 'fs';
const path = './client/pages/Landing.tsx';
let content = fs.readFileSync(path, 'utf8');

// Mapping of Tailwind color classes to design token classes
const replacements = [
  // Backgrounds
  { from: /\bbg-white\b/g, to: 'bg-background' },
  { from: /\bbg-slate-50\b/g, to: 'bg-muted' },
  { from: /\bbg-slate-100\b/g, to: 'bg-muted/80' },
  { from: /\bbg-slate-200\b/g, to: 'bg-border' },
  { from: /\bbg-slate-300\b/g, to: 'bg-border' },
  { from: /\bbg-slate-400\b/g, to: 'bg-border' },
  { from: /\bbg-slate-500\b/g, to: 'bg-border' },
  { from: /\bbg-slate-600\b/g, to: 'bg-secondary' },
  { from: /\bbg-slate-700\b/g, to: 'bg-secondary' },
  { from: /\bbg-slate-800\b/g, to: 'bg-card' },
  { from: /\bbg-slate-900\b/g, to: 'bg-card' },
  { from: /\bbg-slate-950\b/g, to: 'bg-background' },
  // Dark variants
  { from: /\bdark:bg-slate-50\b/g, to: 'dark:bg-muted' },
  { from: /\bdark:bg-slate-100\b/g, to: 'dark:bg-muted' },
  { from: /\bdark:bg-slate-200\b/g, to: 'dark:bg-border' },
  { from: /\bdark:bg-slate-300\b/g, to: 'dark:bg-border' },
  { from: /\bdark:bg-slate-400\b/g, to: 'dark:bg-border' },
  { from: /\bdark:bg-slate-500\b/g, to: 'dark:bg-border' },
  { from: /\bdark:bg-slate-600\b/g, to: 'dark:bg-secondary' },
  { from: /\bdark:bg-slate-700\b/g, to: 'dark:bg-secondary' },
  { from: /\bdark:bg-slate-800\b/g, to: 'dark:bg-card' },
  { from: /\bdark:bg-slate-900\b/g, to: 'dark:bg-card' },
  { from: /\bdark:bg-slate-950\b/g, to: 'dark:bg-background' },
  // Text colors
  { from: /\btext-slate-100\b/g, to: 'text-foreground' },
  { from: /\btext-slate-200\b/g, to: 'text-foreground' },
  { from: /\btext-slate-300\b/g, to: 'text-foreground/80' },
  { from: /\btext-slate-400\b/g, to: 'text-muted-foreground' },
  { from: /\btext-slate-500\b/g, to: 'text-muted-foreground' },
  { from: /\btext-slate-600\b/g, to: 'text-muted-foreground' },
  { from: /\btext-slate-700\b/g, to: 'text-foreground' },
  { from: /\btext-slate-800\b/g, to: 'text-foreground' },
  { from: /\btext-slate-900\b/g, to: 'text-foreground' },
  { from: /\btext-slate-950\b/g, to: 'text-foreground' },
  // Dark text variants
  { from: /\bdark:text-slate-100\b/g, to: 'dark:text-foreground' },
  { from: /\bdark:text-slate-200\b/g, to: 'dark:text-foreground' },
  { from: /\bdark:text-slate-300\b/g, to: 'dark:text-foreground/80' },
  { from: /\bdark:text-slate-400\b/g, to: 'dark:text-muted-foreground' },
  { from: /\bdark:text-slate-500\b/g, to: 'dark:text-muted-foreground' },
  { from: /\bdark:text-slate-600\b/g, to: 'dark:text-muted-foreground' },
  { from: /\bdark:text-slate-700\b/g, to: 'dark:text-foreground' },
  { from: /\bdark:text-slate-800\b/g, to: 'dark:text-foreground' },
  { from: /\bdark:text-slate-900\b/g, to: 'dark:text-foreground' },
  { from: /\bdark:text-slate-950\b/g, to: 'dark:text-foreground' },
  // Border colors
  { from: /\bborder-slate-100\b/g, to: 'border-border' },
  { from: /\bborder-slate-200\b/g, to: 'border-border' },
  { from: /\bborder-slate-300\b/g, to: 'border-border' },
  { from: /\bborder-slate-400\b/g, to: 'border-border' },
  { from: /\bborder-slate-500\b/g, to: 'border-border' },
  { from: /\bborder-slate-600\b/g, to: 'border-border' },
  { from: /\bborder-slate-700\b/g, to: 'border-border' },
  { from: /\bborder-slate-800\b/g, to: 'border-border' },
  { from: /\bborder-slate-900\b/g, to: 'border-border' },
  { from: /\bdark:border-slate-100\b/g, to: 'dark:border-border' },
  { from: /\bdark:border-slate-200\b/g, to: 'dark:border-border' },
  { from: /\bdark:border-slate-300\b/g, to: 'dark:border-border' },
  { from: /\bdark:border-slate-400\b/g, to: 'dark:border-border' },
  { from: /\bdark:border-slate-500\b/g, to: 'dark:border-border' },
  { from: /\bdark:border-slate-600\b/g, to: 'dark:border-border' },
  { from: /\bdark:border-slate-700\b/g, to: 'dark:border-border' },
  { from: /\bdark:border-slate-800\b/g, to: 'dark:border-border' },
  { from: /\bdark:border-slate-900\b/g, to: 'dark:border-border' },
  // Additional colors
  { from: /\bbg-orange-500\b/g, to: 'bg-accent' },
  { from: /\btext-orange-500\b/g, to: 'text-accent' },
  { from: /\bborder-orange-500\b/g, to: 'border-accent' },
];

let updated = false;
for (const { from, to } of replacements) {
  const newContent = content.replace(from, to);
  if (newContent !== content) {
    updated = true;
    content = newContent;
  }
}

if (updated) {
  fs.writeFileSync(path, content);
  console.log('Updated color classes in Landing page');
} else {
  console.log('No changes needed');
}
