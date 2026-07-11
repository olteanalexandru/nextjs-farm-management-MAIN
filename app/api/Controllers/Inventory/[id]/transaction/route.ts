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

    const body = await request.json();
    if (!['IN', 'OUT'].includes(body.type)) {
      return Response.json({ error: 'type must be IN or OUT' }, { status: 400 });
    }
    const qty = Number(body.quantity);
    if (isNaN(qty) || qty <= 0) return Response.json({ error: 'quantity must be positive' }, { status: 400 });

    const txType = String(body.type);
    const txNotes = body.notes ? String(body.notes) : null;
    const txDate = body.transDate ? new Date(body.transDate) : new Date();
    const userId = user.id;

    // Use a serializable transaction so the read and write are atomic:
    // no concurrent OUT request can pass the stock check using a stale snapshot.
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({ where: { id, userId } });
      if (!item) return { error: 'Not found' as const };

      const newQty = txType === 'IN'
        ? Number(item.quantity) + qty
        : Number(item.quantity) - qty;

      if (newQty < 0) return { error: 'Insufficient stock' as const };

      const [transaction, updatedItem] = await Promise.all([
        tx.inventoryTransaction.create({
          data: { userId, itemId: id, type: txType, quantity: qty, notes: txNotes, transDate: txDate }
        }),
        tx.inventoryItem.update({ where: { id }, data: { quantity: newQty } }),
      ]);
      return { transaction, item: updatedItem };
    }, { isolationLevel: 'Serializable' });

    if ('error' in result) {
      const status = result.error === 'Not found' ? 404 : 400;
      return Response.json({ error: result.error }, { status });
    }

    return Response.json({ transaction: result.transaction, item: result.item }, { status: 201 });
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
