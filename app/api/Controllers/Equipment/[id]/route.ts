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
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.equipment.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.equipmentType !== undefined) data.equipmentType = String(body.equipmentType).trim();
    if (body.purchaseDate !== undefined) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    if (body.hoursUsed !== undefined) data.hoursUsed = body.hoursUsed != null ? Number(body.hoursUsed) : null;
    if (body.nextServiceDueAt !== undefined) data.nextServiceDueAt = body.nextServiceDueAt ? new Date(body.nextServiceDueAt) : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

    const item = await prisma.equipment.update({ where: { id }, data });
    return Response.json({ item });
  } catch (error) {
    console.error('PUT equipment error:', error);
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

    const existing = await prisma.equipment.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    await prisma.equipment.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE equipment error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
