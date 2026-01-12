import { useState, useEffect } from 'react';

interface GeoConfig {
    auto?: boolean;
}

export function useGeolocation({ auto = false }: GeoConfig = {}) {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setLoading(false);
            },
            (err) => {
                // Don't show error for permission denied silently if auto is on, just log
                console.warn(`Geolocation error: ${err.message}`);
                setError(`Unable to retrieve location: ${err.message}`);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    useEffect(() => {
        if (auto) getLocation();
    }, [auto]);

    return { location, error, loading, getLocation };
}
