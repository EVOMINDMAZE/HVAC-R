
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

    return (
        <div className={`relative z-0 ${className}`}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

                <MapBoundsUpdater markers={markers} center={markers.length === 1 ? markers[0].position : undefined} autoFit={autoFit} />
            </MapContainer>
        </div>
    );
}
