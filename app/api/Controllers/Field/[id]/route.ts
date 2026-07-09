import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = parseInt(params.id);
    const body = await request.json();

    const field = await prisma.field.update({
      where: { id, userId: user.id },
      data: {
        ...(body.name != null && { name: String(body.name) }),
        ...(body.areaHa !== undefined && { areaHa: body.areaHa != null ? Number(body.areaHa) : null }),
        ...(body.soilType !== undefined && { soilType: body.soilType != null ? String(body.soilType) : null }),
        ...(body.gpsLat !== undefined && { gpsLat: body.gpsLat != null ? Number(body.gpsLat) : null }),
        ...(body.gpsLng !== undefined && { gpsLng: body.gpsLng != null ? Number(body.gpsLng) : null }),
        ...(body.notes !== undefined && { notes: body.notes != null ? String(body.notes) : null }),
      },
    });
    return Response.json({ field });
  } catch (error) {
    console.error('PUT field error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = parseInt(params.id);
    await prisma.field.delete({ where: { id, userId: user.id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE field error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
