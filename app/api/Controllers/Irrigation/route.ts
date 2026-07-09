import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_METHODS = ['DRIP', 'SPRINKLER', 'FLOOD', 'FURROW', 'OTHER'];

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;

    const where: Record<string, unknown> = { userId: user.id };
    if (year) {
      where.eventDate = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59),
      };
    }

    const events = await prisma.irrigationEvent.findMany({
      where,
      orderBy: { eventDate: 'desc' },
    });

    return Response.json({ events });
  } catch (error) {
    console.error('GET irrigation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    if (!body.eventDate) return Response.json({ error: 'eventDate is required' }, { status: 400 });
    if (!VALID_METHODS.includes(body.method)) {
      return Response.json({ error: `method must be one of: ${VALID_METHODS.join(', ')}` }, { status: 400 });
    }

    const event = await prisma.irrigationEvent.create({
      data: {
        userId: user.id,
        fieldId: body.fieldId ? Number(body.fieldId) : null,
        eventDate: new Date(body.eventDate),
        durationMin: body.durationMin ? Number(body.durationMin) : null,
        volumeM3: body.volumeM3 != null ? Number(body.volumeM3) : null,
        method: String(body.method),
        waterSource: body.waterSource ? String(body.waterSource).trim() : null,
        notes: body.notes ? String(body.notes) : null,
      }
    });

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    console.error('POST irrigation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
