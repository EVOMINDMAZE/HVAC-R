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
    <div className="mt-12 grid gap-6 md:grid-cols-3">
      {segments.map((segment) => (
        <div key={segment.title} className="landing-surface landing-path-card rounded-3xl p-6 transition-all duration-400 hover:shadow-lg">
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

            <div className="mt-5 flex items-center gap-2.5">
              <segment.icon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold tracking-tight">{segment.title}</h3>
            </div>

            <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{segment.promise}</p>
            <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{segment.proof}</p>
          </div>

          <div className="mt-6">
            <Link
              to={segment.link}
              onClick={() => onTrack(segment.eventKey, segment.link)}
            >
              <Button variant={segment.link === "/contact" ? "outline" : "default"} className="w-full rounded-xl">
                {segment.cta}
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
