import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_TYPES = ['PLANTING', 'HARVESTING', 'FERTILIZATION', 'PEST_TREATMENT', 'IRRIGATION', 'SOIL_TEST', 'CUSTOM'];

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;

    let dateFilter: { gte?: Date; lte?: Date } | undefined;
    if (year && month) {
      dateFilter = {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59)
      };
    } else if (year) {
      dateFilter = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59)
      };
    }

    const events = await prisma.farmEvent.findMany({
      where: {
        userId: user.id,
        ...(dateFilter ? { date: dateFilter } : {})
      },
      orderBy: { date: 'asc' }
    });

    return Response.json({ events });
  } catch (error) {
    console.error('GET farm events error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    if (!body.title?.trim()) {
      return Response.json({ error: 'title is required' }, { status: 400 });
    }
    if (!body.date) {
      return Response.json({ error: 'date is required' }, { status: 400 });
    }
    if (!VALID_TYPES.includes(body.eventType)) {
      return Response.json({ error: `eventType must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }

    if (body.cropId) {
      const crop = await prisma.crop.findFirst({ where: { id: Number(body.cropId), userId: user.id } });
      if (!crop) return Response.json({ error: 'Crop not found' }, { status: 404 });
    }
    if (body.fieldId) {
      const field = await prisma.field.findFirst({ where: { id: Number(body.fieldId), userId: user.id } });
      if (!field) return Response.json({ error: 'Field not found' }, { status: 404 });
    }

    const event = await prisma.farmEvent.create({
      data: {
        userId: user.id,
        title: String(body.title).trim(),
        eventType: String(body.eventType),
        date: new Date(body.date),
        cropId: body.cropId ? Number(body.cropId) : null,
        fieldId: body.fieldId ? Number(body.fieldId) : null,
        notes: body.notes ? String(body.notes) : null,
        completed: body.completed === true
      }
    });

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    console.error('POST farm event error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
