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

    // Per-crop profitability
    const cropMap = new Map(crops.map(c => [c.id, c.cropName]));
    const harvestRecordsWithCrops = await prisma.harvestRecord.findMany({
      where: { userId: user.id },
      include: { crop: { select: { cropName: true } } },
    });
    const financialRecordsWithCrops = await prisma.financialRecord.findMany({
      where: { userId: user.id },
      include: { crop: { select: { cropName: true } } },
    });

    const profitByCropMap = new Map<string, { revenue: number; expense: number; harvestCount: number; totalYield: number }>();
    for (const r of harvestRecordsWithCrops) {
      const name = r.crop?.cropName ?? 'Unknown';
      const entry = profitByCropMap.get(name) ?? { revenue: 0, expense: 0, harvestCount: 0, totalYield: 0 };
      entry.harvestCount += 1;
      entry.totalYield += Number(r.actualYield);
      profitByCropMap.set(name, entry);
    }
    for (const r of financialRecordsWithCrops) {
      const name = r.crop?.cropName ?? 'Unassigned';
      const entry = profitByCropMap.get(name) ?? { revenue: 0, expense: 0, harvestCount: 0, totalYield: 0 };
      if (r.type === 'REVENUE') entry.revenue += Number(r.amount);
      else entry.expense += Number(r.amount);
      profitByCropMap.set(name, entry);
    }
    const profitByCrop = Array.from(profitByCropMap.entries()).map(([cropName, v]) => ({
      cropName,
      totalRevenue: Math.round(v.revenue * 100) / 100,
      totalExpense: Math.round(v.expense * 100) / 100,
      netProfit: Math.round((v.revenue - v.expense) * 100) / 100,
      harvestCount: v.harvestCount,
      totalYield: Math.round(v.totalYield * 100) / 100,
    })).sort((a, b) => b.netProfit - a.netProfit);

    // Soil health trend — avg pH per month over last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    const recentSoilTestsAll = await prisma.soilTest.findMany({
      where: { userId: user.id, testDate: { gte: twelveMonthsAgo } },
      select: { testDate: true, pH: true },
    });
    const phByMonth = new Map<string, { sum: number; count: number }>();
    for (const t of recentSoilTestsAll) {
      const month = `${t.testDate.getFullYear()}-${String(t.testDate.getMonth() + 1).padStart(2, '0')}`;
      const entry = phByMonth.get(month) ?? { sum: 0, count: 0 };
      entry.sum += Number(t.pH);
      entry.count += 1;
      phByMonth.set(month, entry);
    }
    const soilHealthTrend = Array.from(phByMonth.entries())
      .map(([month, { sum, count }]) => ({ month, avgPH: Math.round((sum / count) * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Yield trend — total yield per month over last 12 months
    const recentHarvests = await prisma.harvestRecord.findMany({
      where: { userId: user.id, harvestDate: { gte: twelveMonthsAgo } },
      select: { harvestDate: true, actualYield: true },
    });
    const yieldByMonth = new Map<string, number>();
    for (const h of recentHarvests) {
      const month = `${h.harvestDate.getFullYear()}-${String(h.harvestDate.getMonth() + 1).padStart(2, '0')}`;
      yieldByMonth.set(month, (yieldByMonth.get(month) ?? 0) + Number(h.actualYield));
    }
    const yieldTrend = Array.from(yieldByMonth.entries())
      .map(([month, totalYield]) => ({ month, totalYield: Math.round(totalYield * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

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
        profitByCrop,
        soilHealthTrend,
        yieldTrend,
      },
      status: 200,
    });
  } catch (error) {
    console.error('GET analytics error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
