import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { ApiResponse } from 'app/types/api';
import { getWeatherForLocation, isWeatherConfigured } from 'app/lib/weather/openWeather';

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

    const weather = await getWeatherForLocation(location);
    return Response.json({ weather, configured: true, status: 200 });
  } catch (error) {
    console.error('GET weather error:', error);
    const response: ApiResponse = { error: 'Internal server error', status: 500 };
    return Response.json(response, { status: 500 });
  }
});
