import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { ToolCategoryWithTools } from "@/content/capabilityMap";

interface HeroMediaProps {
  totalTools: number;
  categories: readonly ToolCategoryWithTools[];
  onViewAllTools?: () => void;
  onFocusCategory?: (categoryId: string) => void;
}

export function HeroMedia({
  totalTools,
  categories,
  onViewAllTools,
  onFocusCategory,
}: HeroMediaProps) {
  const snapshotLabels: Record<string, string> = {
    work_operations: "Work",
    field_diagnostics: "Field",
    engineering: "Engineering",
    compliance: "Compliance",
    client_experience: "Client",
  };
  const snapshotOutcomes: Record<string, string> = {
    work_operations: "Dispatch-to-closeout in one traceable flow.",
    field_diagnostics: "Field diagnostics stay attached to active jobs.",
    engineering: "Engineering checks stay inside service execution.",
    compliance: "EPA records stay current as jobs close.",
    client_experience: "Clients track requests and progress in one place.",
  };

  const [activeHeroCategory, setActiveHeroCategory] = useState<string>(
    categories[0]?.id ?? "",
  );

  useEffect(() => {
    if (!categories.length) {
      setActiveHeroCategory("");
      return;
    }

    const stillValid = categories.some((category) => category.id === activeHeroCategory);
    if (!stillValid && categories[0]?.id) {
      setActiveHeroCategory(categories[0].id);
    }
  }, [categories, activeHeroCategory]);

  const activeCategory = useMemo(() => {
    if (!categories.length) return null;
    return (
      categories.find((category) => category.id === activeHeroCategory) ?? categories[0]
    );
  }, [activeHeroCategory, categories]);

  const activeHeroTools =
    activeCategory && activeCategory.heroToolsMeta.length > 0
      ? activeCategory.heroToolsMeta.slice(0, 3)
      : activeCategory?.tools.slice(0, 3) ?? [];

  const hiddenToolCount = activeCategory
    ? Math.max(activeCategory.tools.length - activeHeroTools.length, 0)
    : 0;

  const handleCategoryFocus = (categoryId: string) => {
    if (categoryId === activeHeroCategory) return;
    setActiveHeroCategory(categoryId);
    onFocusCategory?.(categoryId);
  };

  return (
    <aside className="landing-surface landing-pillars-card rounded-3xl p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {totalTools} live tools
        </p>
        <span className="landing-capability-priority">Owner view</span>
      </div>

      <div className="landing-snapshot-tabs mt-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryFocus(category.id)}
            className={`landing-snapshot-tab ${category.id === activeHeroCategory ? "is-active" : ""}`}
            aria-pressed={category.id === activeHeroCategory}
          >
            <span>{snapshotLabels[category.id] ?? category.title}</span>
            <strong>{category.tools.length}</strong>
          </button>
        ))}
      </div>

      {activeCategory ? (
        <div className="landing-pillar-row landing-snapshot-detail mt-3 rounded-2xl p-4">
          <p className="landing-pillar-proofline">{snapshotOutcomes[activeCategory.id] ?? activeCategory.outcomeLine}</p>
          <p className="landing-snapshot-tools mt-2.5">
            {activeHeroTools.map((tool) => tool.shortName).join(" • ")}
            {hiddenToolCount > 0 ? ` • +${hiddenToolCount} more` : ""}
          </p>
        </div>
      ) : null}

      <a
        href="#tool-inventory"
        className="landing-tool-jump mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        onClick={onViewAllTools}
      >
        View all tools
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </aside>
  );
}
