import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    const records = await prisma.harvestRecord.findMany({
      where: { userId: user.id },
      include: { crop: { select: { cropName: true } } },
      orderBy: { harvestDate: 'asc' },
    });

    const byCropYear = new Map<string, { cropName: string; year: number; totalYield: number; unit: string }>();

    for (const record of records) {
      const year = record.harvestDate.getFullYear();
      const cropName = record.crop?.cropName ?? 'Unknown';
      const key = `${cropName}__${year}__${record.yieldUnit}`;
      const existing = byCropYear.get(key);
      if (existing) {
        existing.totalYield += Number(record.actualYield);
      } else {
        byCropYear.set(key, { cropName, year, totalYield: Number(record.actualYield), unit: record.yieldUnit });
      }
    }

    const yieldByCropYear = Array.from(byCropYear.values()).sort((a, b) => a.year - b.year);

    const totalHarvests = records.length;
    const distinctCrops = new Set(records.map(r => r.cropId)).size;

    // Group totals by unit to avoid mixing incompatible units (kg, tonnes, etc.)
    const totalYieldByUnit = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.yieldUnit] = (acc[r.yieldUnit] ?? 0) + Number(r.actualYield);
      return acc;
    }, {});

    return Response.json({
      summary: {
        totalHarvests,
        totalYieldByUnit,
        distinctCrops,
        yieldByCropYear,
      },
      status: 200,
    });
  } catch (error) {
    console.error('GET harvest summary error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
