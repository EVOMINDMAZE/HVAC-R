import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet/Vite
import iconManager from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconManager,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Job {
    id: string;
    client?: { name: string };
    status: string;
    description?: string;
    address?: string;
}

interface MapViewProps {
    jobs: Job[];
}

// Helper to generate deterministic random coordinates
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

function MapUpdater({ jobs }: { jobs: Job[] }) {
    const map = useMap();

    useEffect(() => {
        if (jobs.length > 0) {
            // Find bounds
            const bounds = L.latLngBounds(jobs.map(j => generateCoords(j.id)));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [jobs, map]);

    return null;
}

export default function MapView({ jobs }: MapViewProps) {
    // Default center (San Francisco)
    const center: [number, number] = [37.7749, -122.4194];

    return (
        <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative z-0">
            <MapContainer
                center={center}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {jobs.map(job => {
                    const position = generateCoords(job.id);
                    return (
                        <Marker key={job.id} position={position}>
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <h3 className="font-bold text-sm mb-1">{job.client?.name || 'Unknown Client'}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{job.address || 'No address provided'}</p>
                                    <div className={`
                                        inline-block px-2 py-0.5 rounded-full text-xs font-medium border
                                        ${job.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            job.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'}
                                    `}>
                                        {job.status.replace('_', ' ').toUpperCase()}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
                <MapUpdater jobs={jobs} />
            </MapContainer>
        </div>
    );
}
