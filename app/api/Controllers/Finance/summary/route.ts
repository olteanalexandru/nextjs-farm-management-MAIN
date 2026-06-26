import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    const records = await prisma.financialRecord.findMany({
      where: { userId: user.id },
      include: { crop: { select: { cropName: true } } },
    });

    let totalRevenue = 0;
    let totalExpense = 0;
    const byCrop = new Map<string, { cropName: string; revenue: number; expense: number }>();
    const byMonth = new Map<string, { month: string; revenue: number; expense: number }>();

    for (const record of records) {
      const amount = Number(record.amount);
      const cropName = record.crop?.cropName ?? 'Unassigned';
      const month = `${record.recordDate.getFullYear()}-${String(record.recordDate.getMonth() + 1).padStart(2, '0')}`;

      if (!byCrop.has(cropName)) byCrop.set(cropName, { cropName, revenue: 0, expense: 0 });
      if (!byMonth.has(month)) byMonth.set(month, { month, revenue: 0, expense: 0 });

      const cropEntry = byCrop.get(cropName)!;
      const monthEntry = byMonth.get(month)!;

      if (record.type === 'REVENUE') {
        totalRevenue += amount;
        cropEntry.revenue += amount;
        monthEntry.revenue += amount;
      } else {
        totalExpense += amount;
        cropEntry.expense += amount;
        monthEntry.expense += amount;
      }
    }

    return Response.json({
      summary: {
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        byCrop: Array.from(byCrop.values()),
        byMonth: Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)),
      },
      status: 200,
    });
  } catch (error) {
    console.error('GET financial summary error:', error);
    return Response.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
});
