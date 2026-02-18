import { Info, RefreshCcw, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatUpdatedAt(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function HudMetaTooltip({
  sourceLabel,
  updatedAt,
  className,
}: {
  sourceLabel?: string | null;
  updatedAt?: string | null;
  className?: string;
}) {
  if (!sourceLabel && !updatedAt) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn("hud-metaBtn", className)}
            aria-label="Monitor information"
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="hud-metaTooltip" side="bottom" align="end">
          <div className="space-y-1">
            {sourceLabel ? (
              <p className="hud-metaTooltip__row">
                <Database className="h-3.5 w-3.5" />
                <span className="min-w-0 truncate">{sourceLabel}</span>
              </p>
            ) : null}
            {updatedAt ? (
              <p className="hud-metaTooltip__row">
                <RefreshCcw className="h-3.5 w-3.5" />
                <span>Updated {formatUpdatedAt(updatedAt)}</span>
              </p>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

