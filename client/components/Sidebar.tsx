import { NavLink, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, UTIL_ITEMS, NAV_GROUPS } from "@/components/navigation";
import { ChevronDown, Briefcase, Zap, FileText, Cpu, LayoutGrid, Wrench, History, Newspaper, PlayCircle, Headphones, BookOpen, ExternalLink, Info, Hammer } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Icons map for dynamic rendering
const Icons = {
  FileText, Zap, Cpu, Wrench, History, LayoutGrid, Newspaper, PlayCircle, Headphones, BookOpen, ExternalLink, Info, Hammer
};

// Richer data for Mega Menu
const CALCULATOR_DETAILS: Record<string, { desc: string }> = {
  '/tools/standard-cycle': { desc: 'Analyze thermodynamic cycles' },
  '/tools/refrigerant-comparison': { desc: 'Compare GWP & performance' },
  '/tools/cascade-cycle': { desc: 'Optimize low-temp systems' },
};

export function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useSupabaseAuth();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  // Mock Notification State for Jobs (would connect to real backend state)
  const newJobsCount = 3;

  const CORE_TOOLS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/diy-calculators', label: 'Builder', icon: Hammer },
    { to: '/troubleshooting', label: 'Troubleshoot', icon: Wrench },
    { to: '/history', label: 'History', icon: History },
  ];

  const CAREER_TOOLS = [
    { to: '/jobs', label: 'Jobs', icon: Briefcase, badge: newJobsCount },
  ];

  const RESOURCES = [
    {
      label: 'Content',
      items: [
        { to: '/blog', label: 'Blog', icon: Newspaper, desc: 'Industry news & insights' },
        { to: '/stories', label: 'Web Stories', icon: PlayCircle, desc: 'Visual bite-sized updates' },
        { to: '/podcasts', label: 'Podcasts', icon: Headphones, desc: 'Audio discussions' },
      ]
    },
    {
      label: 'Support',
      items: [
        { to: '/documentation', label: 'Documentation', icon: BookOpen, desc: 'Guides & references' },
        { to: '/help', label: 'Help Center', icon: ExternalLink, desc: 'FAQs & support' },
        { to: '/about', label: 'About', icon: Info, desc: 'About ThermoNeural' },
      ]
    }
  ];

  const LANDING_ITEMS = [
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/api-docs', label: 'API Docs' },
    { to: '/about', label: 'About' },
  ];

  if (!isAuthenticated) {
    return (
      <nav className="w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm relative z-40 -mt-px pt-0 pb-2 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-1">
            {LANDING_ITEMS.map((item) => (
              <Link key={item.to} to={item.to}>
                <div className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-4 py-2 font-medium text-sm transition-colors cursor-pointer">
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm relative z-40 -mt-px pt-0 pb-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* LEFT ZONE: WORK & CAREER */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar py-2" onMouseLeave={() => setHoveredPath(null)}>

          {/* GROUP 1: CORE WORKFLOW */}
          {CORE_TOOLS.map((item) => (
            <NavItem key={item.to} item={item} isActive={location.pathname === item.to} setHover={setHoveredPath} hovered={hoveredPath} />
          ))}

          {/* CALCULATOR MEGA MENU TRIGGER */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer select-none relative",
                  location.pathname.includes('cycle') || location.pathname.includes('calculator') // Broad check for active state
                    ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800/50"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <Cpu className={cn("h-4 w-4", location.pathname.includes('cycle') ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400")} />
                <span>Calculators</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 animate-in fade-in-0 zoom-in-95">
              <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">Recent</DropdownMenuLabel>
              <Link to="/tools/standard-cycle">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer mb-2">
                  <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600"><FileText className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-200">Standard Cycle</div>
                    <div className="text-xs text-slate-500">Last used 2 hours ago</div>
                  </div>
                </div>
              </Link>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider my-2 ml-2">All Tools</DropdownMenuLabel>
              {/* Dynamically fetching calculator items from manual list for richer display */}
              {Object.entries(CALCULATOR_DETAILS).map(([path, details]) => {
                const navItem = NAV_GROUPS.find(g => g.label === 'Calculators')?.items?.find(i => i.to === path);
                if (!navItem) return null;
                const Icon = navItem.icon;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const isSubActive = location.pathname === path;

                return (
                  <DropdownMenuItem key={path} asChild className="cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50 my-1">
                    <Link to={path} className="flex items-center gap-3 w-full p-2">
                      <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-blue-600"><Icon className="h-4 w-4" /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{navItem.label}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{details.desc}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* DIVIDER */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

          {/* GROUP 2: CAREER */}
          {CAREER_TOOLS.map((item) => (
            <NavItem key={item.to} item={item} isActive={location.pathname === item.to} setHover={setHoveredPath} hovered={hoveredPath} />
          ))}

        </div>

        {/* RIGHT ZONE: RESOURCES & UTILITIES */}
        <div className="hidden md:flex items-center gap-1 pl-4 h-6 my-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                <span className="text-sm font-medium">Resources</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
              {RESOURCES.map((group, idx) => (
                <div key={idx}>
                  {idx > 0 && <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />}
                  <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-2">{group.label}</DropdownMenuLabel>
                  {group.items.map(res => {
                    const Icon = res.icon;
                    return (
                      <DropdownMenuItem key={res.to} asChild className="cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50">
                        <Link to={res.to} className="flex items-center gap-3 p-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{res.label}</span>
                            <span className="text-xs text-slate-500">{res.desc}</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

// Sub-component for individual nav items to handle micro-interactions cleanly
function NavItem({ item, isActive, setHover, hovered }: { item: any; isActive: boolean; setHover: (path: string | null) => void; hovered: string | null }) {

  return (
    <Link to={item.to} onMouseEnter={() => setHover(item.to)}>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer relative select-none",
          isActive
            ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800/50"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        )}
      >
        <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400")} />
        <span>{item.label}</span>

        {/* Notification Badge */}
        {item.badge && (
          <span className="flex h-2 w-2 relative ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
        )}

        {/* Micro-interaction: Hover slide effect (Conceptual - implementing simpler scale first) */}
        {hovered === item.to && !isActive && (
          <motion.div
            layoutId="navbar-hover"
            className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-full -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </div>
    </Link>
  )
}
