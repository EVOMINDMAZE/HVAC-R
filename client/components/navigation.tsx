import React from 'react';
import { Calculator, FileText, Zap, Wrench, History, ExternalLink, BookOpen } from 'lucide-react';

export const NAV_ITEMS: { to: string; label: string; icon: React.ComponentType<any> }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Calculator },
  { to: '/standard-cycle', label: 'Standard', icon: FileText },
  { to: '/refrigerant-comparison', label: 'Comparison', icon: Zap },
  { to: '/cascade-cycle', label: 'Cascade', icon: FileText },
  { to: '/troubleshooting', label: 'Troubleshoot', icon: Wrench },
  { to: '/history', label: 'History', icon: History },
];

export const UTIL_ITEMS: { to: string; label: string; icon?: React.ComponentType<any> }[] = [
  { to: '/documentation', label: 'Docs', icon: BookOpen },
  { to: '/help-center', label: 'Help', icon: ExternalLink },
];
