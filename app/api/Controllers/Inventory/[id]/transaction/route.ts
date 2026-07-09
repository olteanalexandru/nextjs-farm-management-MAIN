import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const POST = withApiAuthRequired(async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const item = await prisma.inventoryItem.findFirst({ where: { id, userId: user.id } });
    if (!item) return Response.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    if (!['IN', 'OUT'].includes(body.type)) {
      return Response.json({ error: 'type must be IN or OUT' }, { status: 400 });
    }
    const qty = Number(body.quantity);
    if (isNaN(qty) || qty <= 0) return Response.json({ error: 'quantity must be positive' }, { status: 400 });

    const newQty = body.type === 'IN'
      ? Number(item.quantity) + qty
      : Number(item.quantity) - qty;

    if (newQty < 0) {
      return Response.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    const [transaction, updatedItem] = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          userId: user.id,
          itemId: id,
          type: String(body.type),
          quantity: qty,
          notes: body.notes ? String(body.notes) : null,
          transDate: body.transDate ? new Date(body.transDate) : new Date(),
        }
      }),
      prisma.inventoryItem.update({
        where: { id },
        data: { quantity: newQty }
      })
    ]);

    return Response.json({ transaction, item: updatedItem }, { status: 201 });
  } catch (error) {
    console.error('POST inventory transaction error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const item = await prisma.inventoryItem.findFirst({ where: { id, userId: user.id } });
    if (!item) return Response.json({ error: 'Not found' }, { status: 404 });

    const transactions = await prisma.inventoryTransaction.findMany({
      where: { itemId: id, userId: user.id },
      orderBy: { transDate: 'desc' },
      take: 50,
    });

    return Response.json({ transactions });
  } catch (error) {
    console.error('GET inventory transactions error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
