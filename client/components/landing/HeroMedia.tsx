import { ArrowRight } from "lucide-react";
import type { ToolCategoryWithTools } from "@/content/capabilityMap";

interface HeroMediaProps {
  totalTools: number;
  categories: readonly ToolCategoryWithTools[];
  onViewAllTools?: () => void;
}

export function HeroMedia({
  totalTools,
  categories,
  onViewAllTools,
}: HeroMediaProps) {
  return (
    <aside className="landing-surface landing-pillars-card rounded-3xl p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {totalTools} route-backed tools
        </p>
        <span className="landing-capability-priority">Owner-first operating view</span>
      </div>

      <p className="landing-capability-subtitle mt-3">
        Five capability pillars mapped to live modules used in daily HVAC&R execution.
      </p>

      <ul className="mt-3 space-y-2.5">
        {categories.map((category) => {
          const heroTools =
            category.heroToolsMeta.length > 0
              ? category.heroToolsMeta
              : category.tools.slice(0, 3);
          const visibleHeroTools = heroTools.slice(0, 2);

          return (
            <li key={category.id} className="landing-pillar-row rounded-2xl p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[1.05rem] font-semibold leading-tight">
                  {category.title}
                </h3>
                <span className="landing-capability-count">
                  {category.tools.length}
                </span>
              </div>

              <p className="landing-pillar-proofline mt-1.5">
                {category.outcomeLine}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {visibleHeroTools.map((tool) => (
                  <span key={tool.route} className="landing-module-tag">
                    {tool.shortName}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <a
        href="#tool-inventory"
        className="landing-tool-jump mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        onClick={onViewAllTools}
      >
        See full {totalTools}-tool inventory
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </aside>
  );
}
