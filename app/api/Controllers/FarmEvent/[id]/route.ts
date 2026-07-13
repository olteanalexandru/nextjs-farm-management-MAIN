import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_TYPES = ['PLANTING', 'HARVESTING', 'FERTILIZATION', 'PEST_TREATMENT', 'IRRIGATION', 'SOIL_TEST', 'CUSTOM'];

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.farmEvent.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (!String(body.title).trim()) return Response.json({ error: 'title cannot be empty' }, { status: 400 });
      data.title = String(body.title).trim();
    }
    if (body.eventType !== undefined) {
      if (!VALID_TYPES.includes(body.eventType)) {
        return Response.json({ error: `eventType must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
      }
      data.eventType = String(body.eventType);
    }
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.cropId !== undefined) data.cropId = body.cropId ? Number(body.cropId) : null;
    if (body.fieldId !== undefined) data.fieldId = body.fieldId ? Number(body.fieldId) : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
    if (body.completed !== undefined) data.completed = body.completed === true;

    const event = await prisma.farmEvent.update({ where: { id }, data });
    return Response.json({ event });
  } catch (error) {
    console.error('PUT farm event error:', error);
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

    const existing = await prisma.farmEvent.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    await prisma.farmEvent.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE farm event error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
