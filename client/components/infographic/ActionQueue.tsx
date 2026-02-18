import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ActionItem {
  id: string;
  jobNumber: string;
  type: string;
  location: string;
  priority: "urgent" | "today" | "scheduled";
  age: string;
  onAssign?: () => void;
  onView?: () => void;
  onSkip?: () => void;
}

export interface ActionQueueProps {
  items: ActionItem[];
  onViewAll?: () => void;
  className?: string;
}

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", icon: AlertTriangle },
  today: { label: "Today", icon: Clock },
  scheduled: { label: "Scheduled", icon: CheckCircle },
} as const;

export function ActionQueue({ items, onViewAll, className }: ActionQueueProps) {
  return (
    <section className={cn("action-queue", className)} data-testid="action-queue">
      <div className="action-queue__header">
        <h3 className="action-queue__title">
          <AlertTriangle className="action-queue__title-icon w-4 h-4" />
          Action Required
        </h3>
      </div>

      <div className="action-queue__list">
        {items.length === 0 ? (
          <div className="action-queue__empty">
            <CheckCircle className="action-queue__empty-icon" />
            <span className="action-queue__empty-text">All caught up!</span>
          </div>
        ) : (
          items.slice(0, 3).map((item) => {
            const config = PRIORITY_CONFIG[item.priority];
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className={cn("action-item", `action-item--${item.priority}`)}
              >
                <div className="action-item__icon">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="action-item__content">
                  <div className="action-item__title">{item.jobNumber}</div>
                  <div className="action-item__meta">
                    {item.type} · {item.location}
                  </div>
                </div>
                <span className="action-item__badge">{config.label}</span>
              </div>
            );
          })
        )}
      </div>

      {items.length > 3 && (
        <Button variant="ghost" size="sm" onClick={onViewAll} className="w-full mt-2">
          View All ({items.length})
        </Button>
      )}
    </section>
  );
}