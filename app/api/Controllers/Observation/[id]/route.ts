import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_CATEGORIES = ['PEST', 'DISEASE', 'EQUIPMENT', 'WEATHER', 'SOIL', 'GENERAL'];

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = parseInt(params.id);
    const body = await request.json();

    const existing = await prisma.fieldObservation.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found', status: 404 }, { status: 404 });

    if (body.category && !VALID_CATEGORIES.includes(String(body.category))) {
      return Response.json({ error: `Invalid category`, status: 400 }, { status: 400 });
    }

    const updated = await prisma.fieldObservation.update({
      where: { id },
      data: {
        ...(body.observedAt !== undefined && { observedAt: new Date(body.observedAt) }),
        ...(body.fieldId !== undefined && { fieldId: body.fieldId ? Number(body.fieldId) : null }),
        ...(body.cropId !== undefined && { cropId: body.cropId ? Number(body.cropId) : null }),
        ...(body.category !== undefined && { category: String(body.category) }),
        ...(body.description !== undefined && { description: String(body.description).trim() }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl ? String(body.photoUrl).trim() : null }),
      },
      include: {
        field: { select: { name: true } },
        crop: { select: { cropName: true } },
      },
    });

    return Response.json({ observation: updated, status: 200 });
  } catch (error) {
    console.error('PUT observation error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = parseInt(params.id);

    const existing = await prisma.fieldObservation.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found', status: 404 }, { status: 404 });

    await prisma.fieldObservation.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE observation error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
