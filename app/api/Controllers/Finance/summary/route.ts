import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate || endDate ? {
      recordDate: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    } : {};

    const records = await prisma.financialRecord.findMany({
      where: { userId: user.id, ...dateFilter },
      include: { crop: { select: { cropName: true } } },
    });

    const byCrop = new Map<string, { cropName: string; revenue: number; expense: number }>();
    const byMonth = new Map<string, { month: string; revenue: number; expense: number }>();
    const byCurrency = new Map<string, { currency: string; revenue: number; expense: number }>();

    for (const record of records) {
      const amount = Number(record.amount);
      const cropName = record.crop?.cropName ?? 'Unassigned';
      const month = `${record.recordDate.getFullYear()}-${String(record.recordDate.getMonth() + 1).padStart(2, '0')}`;
      const currency = record.currency ?? 'EUR';

      if (!byCrop.has(cropName)) byCrop.set(cropName, { cropName, revenue: 0, expense: 0 });
      if (!byMonth.has(month)) byMonth.set(month, { month, revenue: 0, expense: 0 });
      if (!byCurrency.has(currency)) byCurrency.set(currency, { currency, revenue: 0, expense: 0 });

      const cropEntry = byCrop.get(cropName)!;
      const monthEntry = byMonth.get(month)!;
      const currencyEntry = byCurrency.get(currency)!;

      if (record.type === 'REVENUE') {
        cropEntry.revenue += amount;
        monthEntry.revenue += amount;
        currencyEntry.revenue += amount;
      } else {
        cropEntry.expense += amount;
        monthEntry.expense += amount;
        currencyEntry.expense += amount;
      }
    }

    const currencyTotals = Array.from(byCurrency.values()).map(c => ({
      ...c,
      netProfit: c.revenue - c.expense,
    }));

    // Single-currency convenience totals (null when multiple currencies exist)
    const multipleCurrencies = byCurrency.size > 1;
    const singleEntry = !multipleCurrencies ? currencyTotals[0] : null;

    return Response.json({
      summary: {
        totalRevenue: singleEntry?.revenue ?? null,
        totalExpense: singleEntry?.expense ?? null,
        netProfit: singleEntry?.netProfit ?? null,
        multipleCurrencies,
        byCurrency: currencyTotals,
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
