import { useState } from 'react';

interface WeatherData {
    tempF: number;
    humidity: number;
}

export function useWeatherAutoFill() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWeather = async (lat: number, lng: number) => {
        setLoading(true);
        setError(null);
        try {
            // OpenMeteo Free API
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m&temperature_unit=fahrenheit`;
            const res = await fetch(url);

            if (!res.ok) throw new Error("Weather service unavailable");

            const data = await res.json();

            if (data.current) {
                setWeather({
                    tempF: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m
                });
            } else {
                setError("No weather data available");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to fetch weather");
        } finally {
            setLoading(false);
        }
    };

    return { weather, loading, error, fetchWeather };
}
