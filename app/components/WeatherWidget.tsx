'use client';

import { useEffect, useState } from 'react';

interface WeatherSnapshot {
  location: string;
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedMs: number;
  description: string;
  icon: string;
}

interface WeatherForecastDay {
  date: string;
  minTempC: number;
  maxTempC: number;
  precipitationMm: number;
  description: string;
}

interface WeatherData {
  current: WeatherSnapshot;
  forecast: WeatherForecastDay[];
}

export default function WeatherWidget({ fieldLocation }: { fieldLocation: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fieldLocation) {
      setWeather(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/Controllers/Weather?location=${encodeURIComponent(fieldLocation)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load weather');
        setConfigured(json.configured);
        setWeather(json.weather);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fieldLocation]);

  if (!fieldLocation || loading) return null;
  if (!configured) return null;
  if (error) return null;
  if (!weather) {
    return (
      <div className="bg-gray-50 text-gray-500 p-3 rounded-md text-sm">
        Weather unavailable for &quot;{fieldLocation}&quot;.
      </div>
    );
  }

  return (
    <div className="bg-sky-50 p-4 rounded-md space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-sky-900">{weather.current.location}</p>
        <p className="text-sm text-sky-700 capitalize">{weather.current.description}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-sky-800">
        <span>{weather.current.temperatureC}°C (feels {weather.current.feelsLikeC}°C)</span>
        <span>Humidity {weather.current.humidity}%</span>
        <span>Wind {weather.current.windSpeedMs} m/s</span>
      </div>
      {weather.forecast.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pt-1">
          {weather.forecast.map((day) => (
            <div key={day.date} className="text-xs text-sky-700 bg-white rounded px-2 py-1 whitespace-nowrap">
              <p className="font-medium">{day.date.slice(5)}</p>
              <p>{day.minTempC}°/{day.maxTempC}°C</p>
              {day.precipitationMm > 0 && <p>{day.precipitationMm}mm</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
