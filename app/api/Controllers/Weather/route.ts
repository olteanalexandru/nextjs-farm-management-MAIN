import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { ApiResponse } from 'app/types/api';
import { getWeatherForLocation, isWeatherConfigured, WeatherData } from 'app/lib/weather/openWeather';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const weatherCache = new Map<string, { data: WeatherData; expiresAt: number }>();

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const location = request.nextUrl.searchParams.get('location')?.trim();
    if (!location) {
      const response: ApiResponse = { error: 'A location query parameter is required.', status: 400 };
      return Response.json(response, { status: 400 });
    }

    if (!isWeatherConfigured()) {
      return Response.json({ weather: null, configured: false, status: 200 });
    }

    const cacheKey = location.toLowerCase();
    const cached = weatherCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return Response.json({ weather: cached.data, configured: true, status: 200 });
    }

    const weather = await getWeatherForLocation(location);
    if (weather) {
      weatherCache.set(cacheKey, { data: weather, expiresAt: Date.now() + CACHE_TTL_MS });
    }

    return Response.json({ weather, configured: true, status: 200 });
  } catch (error) {
    console.error('GET weather error:', error);
    const response: ApiResponse = { error: 'Internal server error', status: 500 };
    return Response.json(response, { status: 500 });
  }
});
