import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RolePathItem {
  title: string;
  promise: string;
  proof: string;
  cta: string;
  link: string;
  icon: LucideIcon;
  eventKey: string;
  image: string;
}

interface RolePathCardsProps {
  segments: readonly RolePathItem[];
  onTrack: (segment: string, destination: string) => void;
}

export function RolePathCards({ segments, onTrack }: RolePathCardsProps) {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {segments.map((segment) => (
        <div key={segment.title} className="landing-surface landing-path-card rounded-2xl p-5">
          <div>
            <div className="landing-path-media-wrap">
              <img
                src={segment.image}
                alt={`${segment.title} workflow preview`}
                className="landing-path-media"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <segment.icon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{segment.title}</h3>
            </div>

            <p className="mt-3 text-sm text-foreground">{segment.promise}</p>
            <p className="mt-2 text-sm text-muted-foreground">{segment.proof}</p>
          </div>

          <div className="mt-5">
            <Link
              to={segment.link}
              onClick={() => onTrack(segment.eventKey, segment.link)}
            >
              <Button variant={segment.link === "/contact" ? "outline" : "default"} className="w-full">
                {segment.cta}
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
