import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_CATEGORIES = ['SEED', 'FERTILIZER', 'PESTICIDE', 'FUEL', 'EQUIPMENT_PART', 'OTHER'];

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') ?? undefined;

    const items = await prisma.inventoryItem.findMany({
      where: {
        userId: user.id,
        ...(category ? { category } : {})
      },
      orderBy: { name: 'asc' }
    });

    return Response.json({ items });
  } catch (error) {
    console.error('GET inventory error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    if (!body.name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 });
    if (!VALID_CATEGORIES.includes(body.category)) {
      return Response.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }
    if (body.quantity == null || isNaN(Number(body.quantity))) {
      return Response.json({ error: 'quantity is required' }, { status: 400 });
    }
    if (!body.unit?.trim()) return Response.json({ error: 'unit is required' }, { status: 400 });

    const item = await prisma.inventoryItem.create({
      data: {
        userId: user.id,
        name: String(body.name).trim(),
        category: String(body.category),
        quantity: Number(body.quantity),
        unit: String(body.unit).trim(),
        reorderThreshold: body.reorderThreshold != null ? Number(body.reorderThreshold) : null,
        costPerUnit: body.costPerUnit != null ? Number(body.costPerUnit) : null,
        supplier: body.supplier ? String(body.supplier).trim() : null,
        notes: body.notes ? String(body.notes) : null,
      }
    });

    return Response.json({ item }, { status: 201 });
  } catch (error) {
    console.error('POST inventory error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
