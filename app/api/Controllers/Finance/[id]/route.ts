import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_TYPES = ['EXPENSE', 'REVENUE'];

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const recordId = parseInt(params.id, 10);
    if (isNaN(recordId)) {
      return Response.json({ error: 'Invalid record ID', status: 400 }, { status: 400 });
    }

    const existing = await prisma.financialRecord.findUnique({ where: { id: recordId } });
    if (!existing || existing.userId !== user.id) {
      return Response.json({ error: 'Financial record not found', status: 404 }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.type !== undefined) {
      const type = body.type.toUpperCase();
      if (!VALID_TYPES.includes(type)) {
        return Response.json({ error: 'type must be EXPENSE or REVENUE', status: 400 }, { status: 400 });
      }
      data.type = type;
    }
    if (body.category !== undefined) data.category = body.category;
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return Response.json({ error: 'amount must be a positive number', status: 400 }, { status: 400 });
      }
      data.amount = amount;
    }
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.recordDate !== undefined) data.recordDate = new Date(body.recordDate);
    if (body.description !== undefined) data.description = body.description || null;
    if (body.cropId !== undefined) {
      if (body.cropId === null || body.cropId === '') {
        data.cropId = null;
      } else {
        const cropId = parseInt(body.cropId, 10);
        const crop = await prisma.crop.findUnique({ where: { id: cropId } });
        if (!crop || crop.userId !== user.id) {
          return Response.json({ error: 'Crop not found or not owned by you', status: 404 }, { status: 404 });
        }
        data.cropId = cropId;
      }
    }

    const updated = await prisma.financialRecord.update({
      where: { id: recordId },
      data,
      include: { crop: { select: { cropName: true } } },
    });

    return Response.json({
      record: {
        id: updated.id,
        cropId: updated.cropId,
        cropName: updated.crop?.cropName ?? null,
        type: updated.type,
        category: updated.category,
        amount: Number(updated.amount),
        currency: updated.currency,
        recordDate: updated.recordDate,
        description: updated.description,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      status: 200,
    });
  } catch (error) {
    console.error('PUT financial record error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const recordId = parseInt(params.id, 10);
    if (isNaN(recordId)) {
      return Response.json({ error: 'Invalid record ID', status: 400 }, { status: 400 });
    }

    const existing = await prisma.financialRecord.findUnique({ where: { id: recordId } });
    if (!existing || existing.userId !== user.id) {
      return Response.json({ error: 'Financial record not found', status: 404 }, { status: 404 });
    }

    await prisma.financialRecord.delete({ where: { id: recordId } });

    return Response.json({ message: 'Financial record deleted', status: 200 });
  } catch (error) {
    console.error('DELETE financial record error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
