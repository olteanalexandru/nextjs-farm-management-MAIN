import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_CATEGORIES = ['SEED', 'FERTILIZER', 'PESTICIDE', 'FUEL', 'EQUIPMENT_PART', 'OTHER'];

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.inventoryItem.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!String(body.name).trim()) return Response.json({ error: 'name cannot be empty' }, { status: 400 });
      data.name = String(body.name).trim();
    }
    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return Response.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
      }
      data.category = String(body.category);
    }
    if (body.quantity !== undefined) data.quantity = Number(body.quantity);
    if (body.unit !== undefined) data.unit = String(body.unit).trim();
    if (body.reorderThreshold !== undefined) data.reorderThreshold = body.reorderThreshold != null ? Number(body.reorderThreshold) : null;
    if (body.costPerUnit !== undefined) data.costPerUnit = body.costPerUnit != null ? Number(body.costPerUnit) : null;
    if (body.supplier !== undefined) data.supplier = body.supplier ? String(body.supplier).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

    const item = await prisma.inventoryItem.update({ where: { id }, data });
    return Response.json({ item });
  } catch (error) {
    console.error('PUT inventory error:', error);
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

    const existing = await prisma.inventoryItem.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    await prisma.inventoryItem.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE inventory error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
