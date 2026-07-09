import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const fields = await prisma.field.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    });
    return Response.json({ fields, status: 200 });
  } catch (error) {
    console.error('GET fields error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const field = await prisma.field.create({
      data: {
        userId: user.id,
        name: String(body.name),
        areaHa: body.areaHa != null ? Number(body.areaHa) : null,
        soilType: body.soilType != null ? String(body.soilType) : null,
        gpsLat: body.gpsLat != null ? Number(body.gpsLat) : null,
        gpsLng: body.gpsLng != null ? Number(body.gpsLng) : null,
        notes: body.notes != null ? String(body.notes) : null,
      },
    });
    return Response.json({ field, status: 201 }, { status: 201 });
  } catch (error) {
    console.error('POST field error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
