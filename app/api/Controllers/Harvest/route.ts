import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

function serializeHarvestRecord(record: any) {
  return {
    id: record.id,
    cropId: record.cropId,
    cropName: record.crop?.cropName ?? null,
    rotationPlanId: record.rotationPlanId,
    harvestDate: record.harvestDate,
    fieldLocation: record.fieldLocation,
    divisionSize: record.divisionSize !== null ? Number(record.divisionSize) : null,
    actualYield: Number(record.actualYield),
    yieldUnit: record.yieldUnit,
    qualityGrade: record.qualityGrade,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    const records = await prisma.harvestRecord.findMany({
      where: { userId: user.id },
      include: { crop: { select: { cropName: true } } },
      orderBy: { harvestDate: 'desc' },
    });

    return Response.json({ records: records.map(serializeHarvestRecord), status: 200 });
  } catch (error) {
    console.error('GET harvest records error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const cropId = parseInt(body.cropId, 10);
    const actualYield = Number(body.actualYield);

    if (!cropId || isNaN(cropId)) {
      return Response.json({ error: 'A valid cropId is required', status: 400 }, { status: 400 });
    }
    if (!body.harvestDate) {
      return Response.json({ error: 'harvestDate is required', status: 400 }, { status: 400 });
    }
    if (isNaN(actualYield) || actualYield <= 0) {
      return Response.json({ error: 'actualYield must be a positive number', status: 400 }, { status: 400 });
    }

    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop || crop.userId !== user.id) {
      return Response.json({ error: 'Crop not found or not owned by you', status: 404 }, { status: 404 });
    }

    let rotationPlanId: number | null = null;
    if (body.rotationPlanId) {
      const parsedRotationPlanId = parseInt(body.rotationPlanId, 10);
      const rotationPlan = await prisma.rotationPlan.findUnique({
        where: { id: parsedRotationPlanId },
        include: { rotation: true },
      });
      if (!rotationPlan || rotationPlan.rotation.userId !== user.id) {
        return Response.json({ error: 'Rotation plan not found or not owned by you', status: 404 }, { status: 404 });
      }
      rotationPlanId = parsedRotationPlanId;
    }

    const record = await prisma.harvestRecord.create({
      data: {
        userId: user.id,
        cropId,
        rotationPlanId,
        harvestDate: new Date(body.harvestDate),
        fieldLocation: body.fieldLocation || null,
        divisionSize: body.divisionSize !== undefined && body.divisionSize !== '' ? Number(body.divisionSize) : null,
        actualYield,
        yieldUnit: body.yieldUnit || 'kg',
        qualityGrade: body.qualityGrade || null,
        notes: body.notes || null,
      },
      include: { crop: { select: { cropName: true } } },
    });

    return Response.json({ record: serializeHarvestRecord(record), status: 201 }, { status: 201 });
  } catch (error) {
    console.error('POST harvest record error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
