import { NavLink, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

import {
  ChevronDown,
  Briefcase,
  Zap,
  FileText,
  Cpu,
  LayoutGrid,
  Wrench,
  History,
  Newspaper,
  PlayCircle,
  Headphones,
  BookOpen,
  ExternalLink,
  Info,
  Hammer,
  Users,
  Radio,
  Archive,
  Scan,
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useAppNavigation } from "@/hooks/useAppNavigation";
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
import { CompanySwitcher } from "@/components/CompanySwitcher";

// Icons map for dynamic rendering
const Icons = {
  FileText,
  Zap,
  Cpu,
  Wrench,
  History,
  LayoutGrid,
  Newspaper,
  PlayCircle,
  Headphones,
  BookOpen,
  ExternalLink,
  Info,
  Hammer,
  Radio,
};

// Richer data for Mega Menu
const CALCULATOR_DETAILS: Record<string, { desc: string }> = {
  "/tools/standard-cycle": { desc: "Analyze thermodynamic cycles" },
  "/tools/refrigerant-comparison": { desc: "Compare GWP & performance" },
  "/tools/cascade-cycle": { desc: "Optimize low-temp systems" },
};

export function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  // Use our new centralized navigation hook
  const { isAdmin, mainLinks, toolbox, calculators, office, resources } =
    useAppNavigation();

  const LANDING_ITEMS = [
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    {
      to: "https://www.skool.com/hvac-r-business-owner-1296",
      label: "Community",
      external: true,
    },
    { to: "/api-docs", label: "API Docs" },
    { to: "/about", label: "About" },
  ];

  if (!isAuthenticated) {
    return (
      <nav className="w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm relative z-40 -mt-px pt-0 pb-2 transition-all">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-1">
            {LANDING_ITEMS.map((item) =>
              item.external ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-4 py-2 font-medium text-sm transition-colors cursor-pointer">
                    {item.label}
                  </div>
                </a>
              ) : (
                <Link key={item.to} to={item.to}>
                  <div className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-4 py-2 font-medium text-sm transition-colors cursor-pointer">
                    {item.label}
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm relative z-40 -mt-px pt-0 pb-2 transition-all">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LEFT ZONE: WORK & CAREER */}
        <div
          className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar py-2"
          onMouseLeave={() => setHoveredPath(null)}
        >
          {/* 1. MAIN LINKS (Dashboard, Dispatch, My Jobs, Triage) */}
          {mainLinks.map((link) => (
            <NavItem
              key={link.to}
              item={link}
              isActive={location.pathname === link.to}
              setHover={setHoveredPath}
              hovered={hoveredPath}
              roleTag={link.roleTag}
            />
          ))}

          {/* 2. TOOLBOX (Consolidated Tools) */}
          {toolbox.visible && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer select-none relative",
                    toolbox.items.some((t) => location.pathname === t.to)
                      ? "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 shadow-sm ring-1 ring-orange-100 dark:ring-orange-800/50"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  )}
                >
                  <Wrench className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400" />
                  <span>Toolbox</span>
                  {isAdmin && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border leading-none bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      O/T
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 p-1 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800"
              >
                {toolbox.items.map((tool) => (
                  <DropdownMenuItem key={tool.to} asChild>
                    <Link
                      to={tool.to}
                      className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <tool.icon className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">{tool.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 3. CALCULATORS */}
          {calculators.visible && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer select-none relative",
                    location.pathname.includes("cycle") ||
                      location.pathname.includes("calculator")
                      ? "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 shadow-sm ring-1 ring-orange-100 dark:ring-orange-800/50"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  )}
                >
                  <Cpu
                    className={cn(
                      "h-4 w-4",
                      location.pathname.includes("cycle")
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400",
                    )}
                  />
                  <span>Calculators</span>
                  {isAdmin && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border leading-none bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      O/T
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-80 p-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 animate-in fade-in-0 zoom-in-95"
              >
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">
                  Recent
                </DropdownMenuLabel>
                <Link to="/tools/standard-cycle">
                  <div className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer mb-2">
                    <div className="p-1.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        Standard Cycle
                      </div>
                      <div className="text-xs text-slate-500">
                        Last used 2 hours ago
                      </div>
                    </div>
                  </div>
                </Link>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider my-2 ml-2">
                  All Tools
                </DropdownMenuLabel>
                {calculators.items.map((navItem) => {
                  const Icon = navItem.icon;
                  return (
                    <DropdownMenuItem
                      key={navItem.to}
                      asChild
                      className="cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50 my-1"
                    >
                      <Link
                        to={navItem.to}
                        className="flex items-center gap-3 w-full p-2"
                      >
                        <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-orange-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {navItem.label}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {navItem.desc}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 4. OFFICE (Management) */}
          {office.visible && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer select-none relative",
                    office.items.some((i) => location.pathname === i.to)
                      ? "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 shadow-sm ring-1 ring-orange-100 dark:ring-orange-800/50"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  )}
                >
                  <Briefcase className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400" />
                  <span>Office</span>
                  {isAdmin && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border leading-none bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800">
                      O
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 p-1 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800"
              >
                {(() => {
                  console.log(
                    "Rendering Office Items:",
                    office.items.map((i) => i.label),
                  );
                  return null;
                })()}
                {office.items.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link
                      to={item.to}
                      className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* RIGHT ZONE: RESOURCES & UTILITIES */}
        <div className="hidden md:flex items-center gap-4 pl-4 h-6 my-auto">
          <CompanySwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <span className="text-sm font-medium">Resources</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 p-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800"
            >
              {resources.groups.map((group, idx) => (
                <div key={idx}>
                  {idx > 0 && (
                    <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />
                  )}
                  <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-2">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.items.map((res) => {
                    const Icon = res.icon;
                    return (
                      <DropdownMenuItem
                        key={res.to}
                        asChild
                        className="cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50"
                      >
                        {res.to.startsWith("http") ? (
                          <a
                            href={res.to}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2"
                          >
                            <Icon className="h-4 w-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {res.label}
                              </span>
                              <span className="text-xs text-slate-500">
                                {res.desc}
                              </span>
                            </div>
                          </a>
                        ) : (
                          <Link
                            to={res.to}
                            className="flex items-center gap-3 p-2"
                          >
                            <Icon className="h-4 w-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {res.label}
                              </span>
                              <span className="text-xs text-slate-500">
                                {res.desc}
                              </span>
                            </div>
                          </Link>
                        )}
                      </DropdownMenuItem>
                    );
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
function NavItem({
  item,
  isActive,
  setHover,
  hovered,
  roleTag,
}: {
  item: any;
  isActive: boolean;
  setHover: (path: string | null) => void;
  hovered: string | null;
  roleTag?: string;
}) {
  const tagColors: Record<string, string> = {
    O: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800",
    T: "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    C: "bg-slate-600 text-slate-100 border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    "O/T":
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  return (
    <Link to={item.to} onMouseEnter={() => setHover(item.to)}>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer relative select-none",
          isActive
            ? "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 shadow-sm ring-1 ring-orange-100 dark:ring-orange-800/50"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50",
        )}
      >
        <item.icon
          className={cn(
            "h-4 w-4",
            isActive
              ? "text-orange-600 dark:text-orange-400"
              : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400",
          )}
        />
        <span>{item.label}</span>

        {/* Role Tag for Admin */}
        {roleTag && (
          <span
            className={cn(
              "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border leading-none ml-1",
              tagColors[roleTag] || "bg-slate-100",
            )}
          >
            {roleTag}
          </span>
        )}

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
  );
}
