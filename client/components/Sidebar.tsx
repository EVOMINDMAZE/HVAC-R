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
      <nav className="w-full border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-md relative z-40 -mt-px pt-0 pb-2 transition-all">
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
                  <div className="text-cyan-300/80 hover:text-cyan-300 px-4 py-2 font-medium text-sm transition-colors cursor-pointer">
                    {item.label}
                  </div>
                </a>
              ) : (
                <Link key={item.to} to={item.to}>
                  <div className="text-cyan-300/80 hover:text-cyan-300 px-4 py-2 font-medium text-sm transition-colors cursor-pointer">
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
    <nav className="w-full border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-md relative z-40 -mt-px pt-0 pb-2 transition-all">
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
                      ? "text-cyan-400 bg-cyan-950/30 shadow-sm ring-1 ring-cyan-500/30"
                      : "text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-950/30",
                  )}
                >
                  <Wrench className="h-4 w-4 text-cyan-400/80 group-hover:text-cyan-300" />
                  <span>Toolbox</span>
                  {isAdmin && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border leading-none bg-cyan-950/50 text-cyan-400 border-cyan-500/30">
                      O/T
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 p-1 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30"
              >
                {toolbox.items.map((tool) => (
                  <DropdownMenuItem key={tool.to} asChild>
                    <Link
                      to={tool.to}
                      className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-cyan-950/30"
                    >
                      <tool.icon className="h-4 w-4 text-cyan-400" />
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
                      ? "text-cyan-400 bg-cyan-950/30 shadow-sm ring-1 ring-cyan-500/30"
                      : "text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-950/30",
                  )}
                >
                  <Cpu
                    className={cn(
                      "h-4 w-4",
                      location.pathname.includes("cycle")
                        ? "text-cyan-400"
                        : "text-cyan-400/80 group-hover:text-cyan-300",
                    )}
                  />
                  <span>Calculators</span>
                  {isAdmin && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border leading-none bg-cyan-950/50 text-cyan-400 border-cyan-500/30">
                      O/T
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-80 p-2 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 animate-in fade-in-0 zoom-in-95"
              >
                <DropdownMenuLabel className="text-xs font-semibold text-cyan-300/80 uppercase tracking-wider mb-2 ml-2">
                  Recent
                </DropdownMenuLabel>
                <Link to="/tools/standard-cycle">
                  <div className="flex items-center gap-3 p-2 rounded-md hover:bg-cyan-950/30 cursor-pointer mb-2">
                    <div className="p-1.5 rounded bg-cyan-950/50 text-cyan-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-cyan-300">
                        Standard Cycle
                      </div>
                      <div className="text-xs text-cyan-300/80">
                        Last used 2 hours ago
                      </div>
                    </div>
                  </div>
                </Link>
                <DropdownMenuSeparator className="bg-cyan-500/20" />
                <DropdownMenuLabel className="text-xs font-semibold text-cyan-300/80 uppercase tracking-wider my-2 ml-2">
                  All Tools
                </DropdownMenuLabel>
                {calculators.items.map((navItem) => {
                  const Icon = navItem.icon;
                  return (
                    <DropdownMenuItem
                      key={navItem.to}
                      asChild
                      className="cursor-pointer focus:bg-cyan-950/30 my-1"
                    >
                      <Link
                        to={navItem.to}
                        className="flex items-center gap-3 w-full p-2"
                      >
                        <div className="p-1.5 rounded bg-cyan-950/50 text-cyan-400 group-hover:text-cyan-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-cyan-300">
                            {navItem.label}
                          </span>
                          <span className="text-xs text-cyan-300/80">
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
                      ? "text-cyan-400 bg-cyan-950/30 shadow-sm ring-1 ring-cyan-500/30"
                      : "text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-950/30",
                  )}
                >
                  <Briefcase className="h-4 w-4 text-cyan-400/80 group-hover:text-cyan-300" />
                  <span>Office</span>
                  {isAdmin && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border leading-none bg-cyan-950/50 text-cyan-400 border-cyan-500/30">
                      O
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 p-1 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30"
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
                      className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-cyan-950/30 justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span className="bg-cyan-950/50 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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
                className="h-8 gap-2 text-cyan-300/80 hover:text-cyan-300"
              >
                <span className="text-sm font-medium">Resources</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 p-2 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30"
            >
              {resources.groups.map((group, idx) => (
                <div key={idx}>
                  {idx > 0 && (
                    <DropdownMenuSeparator className="my-2 bg-cyan-500/20" />
                  )}
                  <DropdownMenuLabel className="text-xs font-semibold text-cyan-300/80 uppercase tracking-wider mb-1 ml-2">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.items.map((res) => {
                    const Icon = res.icon;
                    return (
                      <DropdownMenuItem
                        key={res.to}
                        asChild
                        className="cursor-pointer focus:bg-cyan-950/30"
                      >
                        {res.to.startsWith("http") ? (
                          <a
                            href={res.to}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2"
                          >
                            <Icon className="h-4 w-4 text-cyan-400/80" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {res.label}
                              </span>
                              <span className="text-xs text-cyan-300/80">
                                {res.desc}
                              </span>
                            </div>
                          </a>
                        ) : (
                          <Link
                            to={res.to}
                            className="flex items-center gap-3 p-2"
                          >
                            <Icon className="h-4 w-4 text-cyan-400/80" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {res.label}
                              </span>
                              <span className="text-xs text-cyan-300/80">
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
    O: "bg-cyan-950/50 text-cyan-400 border-cyan-500/30",
    T: "bg-purple-950/50 text-purple-400 border-purple-500/30",
    C: "bg-slate-900/50 text-slate-300 border-slate-700",
    "O/T":
      "bg-cyan-950/50 text-cyan-400 border-cyan-500/30",
  };

  return (
    <Link to={item.to} onMouseEnter={() => setHover(item.to)}>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer relative select-none",
          isActive
            ? "text-cyan-400 bg-cyan-950/30 shadow-sm ring-1 ring-cyan-500/30"
            : "text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-950/30",
        )}
      >
        <item.icon
          className={cn(
            "h-4 w-4",
            isActive
              ? "text-cyan-400"
              : "text-cyan-400/80 group-hover:text-cyan-300",
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
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        )}

        {/* Micro-interaction: Hover slide effect (Conceptual - implementing simpler scale first) */}
        {hovered === item.to && !isActive && (
          <motion.div
            layoutId="navbar-hover"
            className="absolute inset-0 bg-cyan-950/30 rounded-full -z-10"
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
