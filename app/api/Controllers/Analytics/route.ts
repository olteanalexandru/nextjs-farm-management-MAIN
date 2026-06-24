import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    const [crops, rotations, soilTests, fertilizationPlans, harvestRecords, financialRecords] = await Promise.all([
      prisma.crop.findMany({ where: { userId: user.id, deleted: null } }),
      prisma.rotation.findMany({ where: { userId: user.id }, include: { rotationPlans: true } }),
      prisma.soilTest.findMany({ where: { userId: user.id }, orderBy: { testDate: 'desc' } }),
      prisma.fertilizationPlan.findMany({ where: { userId: user.id } }),
      prisma.harvestRecord.findMany({ where: { userId: user.id } }),
      prisma.financialRecord.findMany({ where: { userId: user.id } }),
    ]);

    const completedPlans = fertilizationPlans.filter(p => p.completed).length;
    const fertilizationCompletionRate = fertilizationPlans.length > 0
      ? Math.round((completedPlans / fertilizationPlans.length) * 100)
      : null;

    const recentSoilTests = soilTests.slice(0, 5);
    const avgPH = recentSoilTests.length > 0
      ? recentSoilTests.reduce((sum, t) => sum + Number(t.pH), 0) / recentSoilTests.length
      : null;

    const nitrogenByYear = new Map<number, { sum: number; count: number }>();
    for (const rotation of rotations) {
      for (const plan of rotation.rotationPlans) {
        if (plan.nitrogenBalance === null) continue;
        const entry = nitrogenByYear.get(plan.year) || { sum: 0, count: 0 };
        entry.sum += Number(plan.nitrogenBalance);
        entry.count += 1;
        nitrogenByYear.set(plan.year, entry);
      }
    }
    const nitrogenBalanceTrend = Array.from(nitrogenByYear.entries())
      .map(([year, { sum, count }]) => ({ year, avgNitrogenBalance: Math.round((sum / count) * 100) / 100 }))
      .sort((a, b) => a.year - b.year);

    const totalYield = harvestRecords.reduce((sum, r) => sum + Number(r.actualYield), 0);
    const totalRevenue = financialRecords.filter(r => r.type === 'REVENUE').reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpense = financialRecords.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + Number(r.amount), 0);

    return Response.json({
      analytics: {
        cropCount: crops.length,
        rotationCount: rotations.length,
        soilTestCount: soilTests.length,
        avgPH: avgPH !== null ? Math.round(avgPH * 100) / 100 : null,
        fertilizationPlanCount: fertilizationPlans.length,
        fertilizationCompletionRate,
        harvestCount: harvestRecords.length,
        totalYield: Math.round(totalYield * 100) / 100,
        distinctHarvestedCrops: new Set(harvestRecords.map(r => r.cropId)).size,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netProfit: Math.round((totalRevenue - totalExpense) * 100) / 100,
        nitrogenBalanceTrend,
      },
      status: 200,
    });
  } catch (error) {
    console.error('GET analytics error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
