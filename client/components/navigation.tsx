import React from 'react';
import { Calculator, FileText, Zap, Wrench, History, ExternalLink, BookOpen, Info, PlayCircle, Headphones, LayoutGrid, Cpu, Newspaper } from 'lucide-react';

export const NAV_ITEMS: { to: string; label: string; icon: React.ComponentType<any> }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Calculator },
  { to: '/tools/standard-cycle', label: 'Standard', icon: FileText },
  { to: '/tools/refrigerant-comparison', label: 'Comparison', icon: Zap },
  { to: '/tools/cascade-cycle', label: 'Cascade', icon: FileText },
  { to: '/diy-calculators', label: 'DIY Tools', icon: Calculator },
  { to: '/troubleshooting', label: 'Troubleshoot', icon: Wrench },
  { to: '/history', label: 'History', icon: History },
];

export const UTIL_ITEMS: { to: string; label: string; icon?: React.ComponentType<any> }[] = [
  { to: '/about', label: 'About', icon: Info },
  { to: '/documentation', label: 'Docs', icon: BookOpen },
  { to: '/help', label: 'Help', icon: ExternalLink },
];

export const NAV_GROUPS = [
  {
    type: 'link',
    item: { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid }
  },
  {
    type: 'dropdown',
    label: 'Calculators',
    icon: Calculator,
    items: [
      { to: '/tools/standard-cycle', label: 'Standard', icon: FileText },
      { to: '/tools/refrigerant-comparison', label: 'Comparison', icon: Zap },
      { to: '/tools/cascade-cycle', label: 'Cascade', icon: FileText },
      { to: '/diy-calculators', label: 'DIY Tools', icon: Cpu },
    ]
  },
  {
    type: 'dropdown',
    label: 'Media',
    icon: PlayCircle,
    items: [
      { to: '/blog', label: 'Blog', icon: Newspaper },
      { to: '/stories', label: 'Stories', icon: PlayCircle },
      { to: '/podcasts', label: 'Podcasts', icon: Headphones },
    ]
  },
  {
    type: 'link',
    item: { to: '/troubleshooting', label: 'Troubleshoot', icon: Wrench }
  },
  {
    type: 'link',
    item: { to: '/history', label: 'History', icon: History }
  }
];
