import LiveMap, { MapMarker } from "@/components/job/LiveMap";

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

export default function MapView({ jobs }: MapViewProps) {
  // Only jobs with real geocoded coordinates appear on the map —
  // no fabricated fallback positions.
  const geocodedJobs = (jobs || []).filter((job) => job.geo_lat && job.geo_lng);

  if (!jobs || jobs.length === 0) {
    return (
      <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-slate-50 flex items-center justify-center text-slate-400">
        No active jobs to display on map.
      </div>
    );
  }

  if (geocodedJobs.length === 0) {
    return (
      <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <p>No geocoded jobs to display on map yet.</p>
        <p className="text-xs mt-2">
          Job addresses need coordinates before they can be plotted.
        </p>
      </div>
    );
  }

  const markers: MapMarker[] = geocodedJobs.map((job) => {
    const position = [job.geo_lat!, job.geo_lng!] as [number, number];

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
    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative z-0">
      <LiveMap markers={markers} />
    </div>
  );
}
