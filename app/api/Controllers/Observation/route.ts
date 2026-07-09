import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_CATEGORIES = ['PEST', 'DISEASE', 'EQUIPMENT', 'WEATHER', 'SOIL', 'GENERAL'];

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const observations = await prisma.fieldObservation.findMany({
      where: {
        userId: user.id,
        ...(category ? { category } : {}),
      },
      include: {
        field: { select: { name: true } },
        crop: { select: { cropName: true } },
      },
      orderBy: { observedAt: 'desc' },
      take: 100,
    });

    return Response.json({ observations, status: 200 });
  } catch (error) {
    console.error('GET observations error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    if (!body.observedAt) {
      return Response.json({ error: 'observedAt is required', status: 400 }, { status: 400 });
    }
    if (!body.description || String(body.description).trim().length < 3) {
      return Response.json({ error: 'description must be at least 3 characters', status: 400 }, { status: 400 });
    }
    if (!body.category || !VALID_CATEGORIES.includes(String(body.category))) {
      return Response.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}`, status: 400 }, { status: 400 });
    }

    const observation = await prisma.fieldObservation.create({
      data: {
        userId: user.id,
        observedAt: new Date(body.observedAt),
        fieldId: body.fieldId ? Number(body.fieldId) : null,
        cropId: body.cropId ? Number(body.cropId) : null,
        category: String(body.category),
        description: String(body.description).trim(),
        photoUrl: body.photoUrl ? String(body.photoUrl).trim() : null,
      },
      include: {
        field: { select: { name: true } },
        crop: { select: { cropName: true } },
      },
    });

    return Response.json({ observation, status: 201 }, { status: 201 });
  } catch (error) {
    console.error('POST observation error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
