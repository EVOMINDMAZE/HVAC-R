import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface RecentActivityItem {
  id: string;
  name: string;
  type: string;
  timestamp: string;
  onView?: () => void;
  onRerun?: () => void;
}

export interface RecentActivityProps {
  items: RecentActivityItem[];
  onViewHistory?: () => void;
  className?: string;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function RecentActivity({ items, onViewHistory, className }: RecentActivityProps) {
  return (
    <section className={cn("recent-activity", className)} data-testid="recent-activity">
      <div className="recent-activity__header">
        <h3 className="recent-activity__title">Recent Activity</h3>
        <Button variant="ghost" size="sm" onClick={onViewHistory}>
          View History
        </Button>
      </div>

      <div className="recent-activity__list">
        {items.length === 0 ? (
          <div className="recent-activity__empty">
            <Activity className="w-6 h-6 opacity-50" />
            <span className="text-sm">No recent activity</span>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-foreground truncate">
                  {item.name}
                </span>
                <span className="block text-xs text-muted-foreground">{item.type}</span>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatTimestamp(item.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}