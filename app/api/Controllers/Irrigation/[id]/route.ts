import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_METHODS = ['DRIP', 'SPRINKLER', 'FLOOD', 'FURROW', 'OTHER'];

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.irrigationEvent.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.eventDate !== undefined) data.eventDate = new Date(body.eventDate);
    if (body.method !== undefined) {
      if (!VALID_METHODS.includes(body.method)) {
        return Response.json({ error: `method must be one of: ${VALID_METHODS.join(', ')}` }, { status: 400 });
      }
      data.method = String(body.method);
    }
    if (body.fieldId !== undefined) data.fieldId = body.fieldId ? Number(body.fieldId) : null;
    if (body.durationMin !== undefined) data.durationMin = body.durationMin ? Number(body.durationMin) : null;
    if (body.volumeM3 !== undefined) data.volumeM3 = body.volumeM3 != null ? Number(body.volumeM3) : null;
    if (body.waterSource !== undefined) data.waterSource = body.waterSource ? String(body.waterSource).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

    const event = await prisma.irrigationEvent.update({ where: { id }, data });
    return Response.json({ event });
  } catch (error) {
    console.error('PUT irrigation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.irrigationEvent.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    await prisma.irrigationEvent.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE irrigation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
