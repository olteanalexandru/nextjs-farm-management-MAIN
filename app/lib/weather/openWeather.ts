export interface WeatherSnapshot {
  location: string;
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedMs: number;
  description: string;
  icon: string;
}

export interface WeatherForecastDay {
  date: string;
  minTempC: number;
  maxTempC: number;
  precipitationMm: number;
  description: string;
}

export interface WeatherData {
  current: WeatherSnapshot;
  forecast: WeatherForecastDay[];
}

export function isWeatherConfigured(): boolean {
  return Boolean(process.env.OPENWEATHERMAP_API_KEY);
}

export async function getWeatherForLocation(location: string): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const trimmedLocation = location.trim();
  if (!apiKey || !trimmedLocation) return null;

  const params = new URLSearchParams({ q: trimmedLocation, appid: apiKey, units: 'metric' });

  let currentRes: Response;
  let forecastRes: Response;
  try {
    [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?${params.toString()}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`),
    ]);
  } catch {
    return null;
  }

  if (!currentRes.ok || !forecastRes.ok) return null;

  const currentJson = await currentRes.json();
  const forecastJson = await forecastRes.json();

  const current: WeatherSnapshot = {
    location: currentJson.name || trimmedLocation,
    temperatureC: Math.round(currentJson.main?.temp ?? 0),
    feelsLikeC: Math.round(currentJson.main?.feels_like ?? 0),
    humidity: currentJson.main?.humidity ?? 0,
    windSpeedMs: currentJson.wind?.speed ?? 0,
    description: currentJson.weather?.[0]?.description ?? '',
    icon: currentJson.weather?.[0]?.icon ?? '',
  };

  const byDay = new Map<string, { min: number; max: number; precip: number; description: string }>();
  for (const item of forecastJson.list ?? []) {
    const date = String(item.dt_txt || '').slice(0, 10);
    if (!date) continue;
    const temp = item.main?.temp ?? 0;
    const entry = byDay.get(date) || { min: temp, max: temp, precip: 0, description: item.weather?.[0]?.description ?? '' };
    entry.min = Math.min(entry.min, item.main?.temp_min ?? temp);
    entry.max = Math.max(entry.max, item.main?.temp_max ?? temp);
    entry.precip += (item.rain?.['3h'] ?? 0) + (item.snow?.['3h'] ?? 0);
    byDay.set(date, entry);
  }

  const forecast: WeatherForecastDay[] = Array.from(byDay.entries())
    .slice(0, 5)
    .map(([date, entry]) => ({
      date,
      minTempC: Math.round(entry.min),
      maxTempC: Math.round(entry.max),
      precipitationMm: Math.round(entry.precip * 10) / 10,
      description: entry.description,
    }));

  return { current, forecast };
}

export function summarizeForecast(forecast: WeatherForecastDay[]): string {
  if (forecast.length === 0) return '';
  const totalPrecip = Math.round(forecast.reduce((sum, d) => sum + d.precipitationMm, 0) * 10) / 10;
  const maxTemp = Math.max(...forecast.map((d) => d.maxTempC));
  const minTemp = Math.min(...forecast.map((d) => d.minTempC));
  return `Next ${forecast.length} days: ${minTemp}-${maxTemp}°C, ~${totalPrecip}mm total precipitation.`;
}
