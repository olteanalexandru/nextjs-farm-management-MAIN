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
    const recordId = parseInt(params.id, 10);
    if (isNaN(recordId)) {
      return Response.json({ error: 'Invalid record ID', status: 400 }, { status: 400 });
    }

    const existing = await prisma.harvestRecord.findUnique({ where: { id: recordId } });
    if (!existing || existing.userId !== user.id) {
      return Response.json({ error: 'Harvest record not found', status: 404 }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.harvestDate !== undefined) data.harvestDate = new Date(body.harvestDate);
    if (body.fieldLocation !== undefined) data.fieldLocation = body.fieldLocation || null;
    if (body.divisionSize !== undefined) {
      data.divisionSize = body.divisionSize !== '' ? Number(body.divisionSize) : null;
    }
    if (body.actualYield !== undefined) {
      const actualYield = Number(body.actualYield);
      if (isNaN(actualYield) || actualYield <= 0) {
        return Response.json({ error: 'actualYield must be a positive number', status: 400 }, { status: 400 });
      }
      data.actualYield = actualYield;
    }
    if (body.yieldUnit !== undefined) data.yieldUnit = body.yieldUnit;
    if (body.qualityGrade !== undefined) data.qualityGrade = body.qualityGrade || null;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const updated = await prisma.harvestRecord.update({
      where: { id: recordId },
      data,
      include: { crop: { select: { cropName: true } } },
    });

    return Response.json({
      record: {
        id: updated.id,
        cropId: updated.cropId,
        cropName: updated.crop?.cropName ?? null,
        rotationPlanId: updated.rotationPlanId,
        harvestDate: updated.harvestDate,
        fieldLocation: updated.fieldLocation,
        divisionSize: updated.divisionSize !== null ? Number(updated.divisionSize) : null,
        actualYield: Number(updated.actualYield),
        yieldUnit: updated.yieldUnit,
        qualityGrade: updated.qualityGrade,
        notes: updated.notes,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      status: 200,
    });
  } catch (error) {
    console.error('PUT harvest record error:', error);
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

    const existing = await prisma.harvestRecord.findUnique({ where: { id: recordId } });
    if (!existing || existing.userId !== user.id) {
      return Response.json({ error: 'Harvest record not found', status: 404 }, { status: 404 });
    }

    await prisma.harvestRecord.delete({ where: { id: recordId } });

    return Response.json({ message: 'Harvest record deleted', status: 200 });
  } catch (error) {
    console.error('DELETE harvest record error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
