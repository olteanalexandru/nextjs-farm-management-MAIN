import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const OPTIMAL_PH = 6.5;
const OPTIMAL_N = 50; // mg/kg

function phAdjustmentFactor(pH: number): number {
  const deviation = Math.abs(pH - OPTIMAL_PH);
  return Math.max(0.6, 1 - deviation * 0.08);
}

function nitrogenAdjustmentFactor(nitrogen: number): number {
  if (nitrogen >= OPTIMAL_N) return 1.0;
  return Math.max(0.5, nitrogen / OPTIMAL_N);
}

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    const currentYear = new Date().getFullYear();

    // Get crops currently planted via rotation plans in the current year
    const rotationPlans = await prisma.rotationPlan.findMany({
      where: { rotation: { userId: user.id }, year: currentYear },
      include: { crop: true },
    });

    // Build unique crop list
    const cropMap = new Map<number, { cropId: number; cropName: string; nitrogenDemand: number }>();
    for (const plan of rotationPlans) {
      if (!cropMap.has(plan.cropId)) {
        cropMap.set(plan.cropId, {
          cropId: plan.cropId,
          cropName: plan.crop.cropName,
          nitrogenDemand: Number(plan.crop.nitrogenDemand),
        });
      }
    }

    if (cropMap.size === 0) {
      return Response.json({ forecasts: [], currentYear, status: 200 });
    }

    const cropIds = Array.from(cropMap.keys());

    // Fetch historical harvest records for these crops (last 5 years, kg unit only for comparability)
    const harvestRecords = await prisma.harvestRecord.findMany({
      where: {
        userId: user.id,
        cropId: { in: cropIds },
        harvestDate: { gte: new Date(`${currentYear - 5}-01-01`) },
      },
      orderBy: { harvestDate: 'asc' },
    });

    // Most recent soil test
    const latestSoilTest = await prisma.soilTest.findFirst({
      where: { userId: user.id },
      orderBy: { testDate: 'desc' },
    });

    const soilPH = latestSoilTest ? Number(latestSoilTest.pH) : OPTIMAL_PH;
    const soilN = latestSoilTest ? Number(latestSoilTest.nitrogen) : OPTIMAL_N;
    const phFactor = phAdjustmentFactor(soilPH);
    const nFactor = nitrogenAdjustmentFactor(soilN);

    // Per-crop average yield (normalise to kg: 1 t = 1000 kg, t/ha and kg/ha kept as-is conceptually)
    const yieldByCrop = new Map<number, { total: number; count: number; unit: string }>();
    for (const record of harvestRecords) {
      let yieldKg = Number(record.actualYield);
      const unit = record.yieldUnit;
      if (unit === 't') yieldKg *= 1000;
      const entry = yieldByCrop.get(record.cropId) || { total: 0, count: 0, unit: unit === 't' ? 'kg' : unit };
      entry.total += yieldKg;
      entry.count += 1;
      yieldByCrop.set(record.cropId, entry);
    }

    const forecasts = Array.from(cropMap.values()).map((crop) => {
      const hist = yieldByCrop.get(crop.cropId);
      if (!hist || hist.count === 0) {
        return {
          cropId: crop.cropId,
          cropName: crop.cropName,
          historicalSamples: 0,
          baselineYield: null,
          forecastYield: null,
          unit: 'kg',
          phFactor: Math.round(phFactor * 100) / 100,
          nFactor: Math.round(nFactor * 100) / 100,
          notes: 'No harvest history available for this crop.',
        };
      }
      const baseline = hist.total / hist.count;
      const forecast = baseline * phFactor * nFactor;
      return {
        cropId: crop.cropId,
        cropName: crop.cropName,
        historicalSamples: hist.count,
        baselineYield: Math.round(baseline),
        forecastYield: Math.round(forecast),
        unit: hist.unit,
        phFactor: Math.round(phFactor * 100) / 100,
        nFactor: Math.round(nFactor * 100) / 100,
        notes: latestSoilTest
          ? `Based on soil pH ${soilPH} and N ${soilN} mg/kg (test: ${latestSoilTest.testDate.toISOString().slice(0, 10)}).`
          : 'No soil test found — soil adjustment factors set to optimal.',
      };
    });

    return Response.json({
      forecasts,
      currentYear,
      soilSummary: latestSoilTest
        ? { pH: soilPH, nitrogen: soilN, testDate: latestSoilTest.testDate.toISOString().slice(0, 10) }
        : null,
      status: 200,
    });
  } catch (error) {
    console.error('GET forecast error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
