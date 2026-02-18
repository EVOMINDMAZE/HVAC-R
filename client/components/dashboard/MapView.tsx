import LiveMap, { MapMarker } from "@/components/job/LiveMap";
import { MapPin, Route } from "lucide-react";

interface Job {
  id: string;
  client?: { name: string };
  status: string;
  description?: string;
  address?: string;
  geo_lat?: number;
  geo_lng?: number;
}

interface MapViewProps {
  jobs: Job[];
}

// Helper to generate deterministic random coordinates (Fallback)
const generateCoords = (id: string) => {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Base coords (San Francisco for demo)
  const baseLat = 37.7749;
  const baseLng = -122.4194;

  // Offset by +/- 0.05 degrees (approx 5km)
  const latOffset = (hash % 1000) / 10000;
  const lngOffset = ((hash >> 16) % 1000) / 10000;

  return [baseLat + latOffset, baseLng + lngOffset] as [number, number];
};

export default function MapView({ jobs }: MapViewProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="app-surface app-elev-1 h-[460px] w-full overflow-hidden p-6 sm:p-8">
        <div className="flex h-full items-center justify-center">
          <div className="max-w-lg text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary/50">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              No active jobs on the map yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Jobs appear here once they are scheduled and assigned. Use Create
              Job or clear filters to widen results.
            </p>
            <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Route className="h-3.5 w-3.5 text-primary" />
              Live routing and location context activates automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const markers: MapMarker[] = jobs.map((job) => {
    // Use real coords if available, otherwise fallback
    const hasRealCoords = job.geo_lat && job.geo_lng;
    const position = hasRealCoords
      ? ([job.geo_lat!, job.geo_lng!] as [number, number])
      : generateCoords(job.id);

    return {
      id: job.id,
      position,
      title: job.client?.name || "Job",
      popupContent: (
        <div className="p-2 min-w-[200px]">
          <h3 className="font-bold text-sm mb-1">
            {job.client?.name || "Unknown Client"}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            {job.address || "No address provided"}
            {!hasRealCoords && (
              <span className="block mt-1 italic text-[10px] text-orange-400">
                (Simulated Location)
              </span>
            )}
          </p>
          <div
            className={`
                        inline-block px-2 py-0.5 rounded-full text-xs font-medium border
                        ${
                          job.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : job.status === "en_route"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : job.status === "on_site"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                    `}
          >
            {job.status.replace("_", " ").toUpperCase()}
          </div>
        </div>
      ),
    };
  });

  return (
    <div className="app-surface app-elev-1 relative z-0 h-[460px] w-full overflow-hidden">
      <LiveMap markers={markers} />
    </div>
  );
}
