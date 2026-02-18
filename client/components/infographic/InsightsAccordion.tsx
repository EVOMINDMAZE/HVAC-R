import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface InsightCard {
  id: string;
  label: string;
  value: string | number;
  meta?: string;
  tone?: "default" | "warning" | "success" | "info";
}

export interface InsightsAccordionProps {
  summary: string;
  cards: InsightCard[];
  onViewDetails?: () => void;
  className?: string;
}

export function InsightsAccordion({
  summary,
  cards,
  onViewDetails,
  className,
}: InsightsAccordionProps) {
  return (
    <details className={cn("insights-accordion", className)} data-testid="insights-accordion">
      <summary className="insights-accordion__summary">
        <ChevronRight className="insights-accordion__chevron w-4 h-4" />
        <span className="insights-accordion__label">Insights</span>
        <span className="insights-accordion__hint">{summary}</span>
      </summary>

      <div className="insights-accordion__content">
        <div className="insights-accordion__grid">
          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "insights-accordion__card",
                card.tone && `insights-accordion__card--${card.tone}`
              )}
            >
              <span className="insights-accordion__card-label">{card.label}</span>
              <span className="insights-accordion__card-value">{card.value}</span>
              {card.meta && (
                <span className="insights-accordion__card-meta">{card.meta}</span>
              )}
            </div>
          ))}
        </div>

        {onViewDetails && (
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
          </div>
        )}
      </div>
    </details>
  );
}