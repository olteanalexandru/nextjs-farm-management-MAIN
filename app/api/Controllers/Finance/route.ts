import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_TYPES = ['EXPENSE', 'REVENUE'];

function serializeFinancialRecord(record: any) {
  return {
    id: record.id,
    cropId: record.cropId,
    cropName: record.crop?.cropName ?? null,
    type: record.type,
    category: record.category,
    amount: Number(record.amount),
    currency: record.currency,
    recordDate: record.recordDate,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    const records = await prisma.financialRecord.findMany({
      where: { userId: user.id },
      include: { crop: { select: { cropName: true } } },
      orderBy: { recordDate: 'desc' },
    });

    return Response.json({ records: records.map(serializeFinancialRecord), status: 200 });
  } catch (error) {
    console.error('GET financial records error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const type = (body.type || '').toUpperCase();
    const amount = Number(body.amount);

    if (!VALID_TYPES.includes(type)) {
      return Response.json({ error: 'type must be EXPENSE or REVENUE', status: 400 }, { status: 400 });
    }
    if (!body.category) {
      return Response.json({ error: 'category is required', status: 400 }, { status: 400 });
    }
    if (isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'amount must be a positive number', status: 400 }, { status: 400 });
    }
    if (!body.recordDate) {
      return Response.json({ error: 'recordDate is required', status: 400 }, { status: 400 });
    }

    let cropId: number | null = null;
    if (body.cropId) {
      cropId = parseInt(body.cropId, 10);
      const crop = await prisma.crop.findUnique({ where: { id: cropId } });
      if (!crop || crop.userId !== user.id) {
        return Response.json({ error: 'Crop not found or not owned by you', status: 404 }, { status: 404 });
      }
    }

    const record = await prisma.financialRecord.create({
      data: {
        userId: user.id,
        cropId,
        type,
        category: body.category,
        amount,
        currency: body.currency || 'EUR',
        recordDate: new Date(body.recordDate),
        description: body.description || null,
      },
      include: { crop: { select: { cropName: true } } },
    });

    return Response.json({ record: serializeFinancialRecord(record), status: 201 }, { status: 201 });
  } catch (error) {
    console.error('POST financial record error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
