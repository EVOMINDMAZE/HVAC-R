
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Route } from "lucide-react";

// ----------------------------------------------------------------------
// 1. Icon Setup (Leaflet + Vite Workaround)
// ----------------------------------------------------------------------
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

// Enforce default icon
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for different states
export const TechIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1086/1086474.png', // Car/Truck icon
    shadowUrl: iconShadowUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

// ----------------------------------------------------------------------
// 2. Types
// ----------------------------------------------------------------------
export interface MapMarker {
    id: string;
    position: [number, number];
    title?: string;
    popupContent?: React.ReactNode;
    icon?: L.Icon;
}

interface LiveMapProps {
    markers: MapMarker[];
    center?: [number, number];
    zoom?: number;
    className?: string;
    autoFit?: boolean;
}

// ----------------------------------------------------------------------
// 3. Helper: Auto-Fit Bounds
// ----------------------------------------------------------------------
function MapBoundsUpdater({ markers, center, autoFit }: { markers: MapMarker[], center?: [number, number], autoFit?: boolean }) {
    const map = useMap();

    useEffect(() => {
        // If explicit center provided, fly to it
        if (center) {
            map.flyTo(center, map.getZoom());
            return;
        }

        // Otherwise if autoFit, fit to markers
        if (autoFit && markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => m.position));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [markers, center, autoFit, map]);

    return null;
}

// ----------------------------------------------------------------------
// 4. Component: LiveMap
// ----------------------------------------------------------------------
export default function LiveMap({
    markers,
    center = [40.7128, -74.0060], // NYC Default
    zoom = 13,
    className = "h-full w-full",
    autoFit = true
}: LiveMapProps) {
    const [tilesReady, setTilesReady] = useState(false);
    const [tileError, setTileError] = useState(false);

    useEffect(() => {
        setTilesReady(false);
        setTileError(false);
    }, [markers, center, zoom]);

    const mapCenter = useMemo<[number, number]>(() => {
        if (markers.length === 1) return markers[0]?.position ?? center;
        return center;
    }, [markers, center]);

    const handleTilesLoaded = () => setTilesReady(true);
    const handleTileError = () => setTileError(true);

    return (
        <div className={`relative z-0 ${className}`}>
            {!tilesReady && !tileError ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/40 backdrop-blur-[1px]">
                    <div className="rounded-xl border border-border bg-background/95 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                        Loading dispatch map...
                    </div>
                </div>
            ) : null}

            {tileError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 p-6">
                    <div className="max-w-md text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/80">
                            <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Map preview unavailable</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Location tiles could not load right now. Switch to list view to keep dispatching jobs.
                        </p>
                        <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <Route className="h-3.5 w-3.5 text-primary" />
                            Job and routing data remain available in the queue.
                        </p>
                    </div>
                </div>
            ) : null}

            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    eventHandlers={{
                        load: handleTilesLoaded,
                        tileerror: handleTileError,
                    }}
                />

                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={marker.position}
                        icon={marker.icon || DefaultIcon}
                    >
                        {marker.popupContent && (
                            <Popup>{marker.popupContent}</Popup>
                        )}
                    </Marker>
                ))}

                <MapBoundsUpdater markers={markers} center={markers.length === 1 ? markers[0]?.position : undefined} autoFit={autoFit} />
            </MapContainer>
        </div>
    );
}
