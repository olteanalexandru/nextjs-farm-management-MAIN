import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import { SMTPClient } from 'emailjs';

const CRON_SECRET = process.env.CRON_SECRET;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? '465');
const FROM_EMAIL = process.env.FROM_EMAIL ?? SMTP_USER ?? 'noreply@farmapp.local';

function isSmtpConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!isSmtpConfigured()) return;

  const client = new SMTPClient({
    user: SMTP_USER!,
    password: SMTP_PASS!,
    host: SMTP_HOST!,
    port: SMTP_PORT,
    ssl: SMTP_PORT === 465,
    tls: SMTP_PORT === 587,
  });

  await client.sendAsync({
    text,
    from: FROM_EMAIL,
    to,
    subject,
  } as any);
}

function daysFromNow(date: Date, now: number): number {
  return Math.ceil((date.getTime() - now) / 86400000);
}

export async function GET(request: NextRequest) {
  // Accept Vercel's injected Authorization header OR a ?secret= query param
  // (Vercel cron sends: Authorization: Bearer <CRON_SECRET>)
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const validBearer = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const validQuery = CRON_SECRET && querySecret === CRON_SECRET;
  if (!validBearer && !validQuery) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const nowDate = new Date();
    const now = nowDate.getTime();
    const in3Days = new Date(now + 3 * 86400000);
    const in7Days = new Date(now + 7 * 86400000);

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });

    const userIds = users.map(u => u.id);

    // Fetch all upcoming events in 3 batch queries instead of 3N
    const [duePlans, nearHarvestCrops, dueSubsidies] = await Promise.all([
      prisma.fertilizationPlan.findMany({
        where: {
          userId: { in: userIds },
          completed: false,
          plannedDate: { gte: nowDate, lte: in3Days },
        },
        include: { crop: { select: { cropName: true } } },
      }),
      prisma.crop.findMany({
        where: {
          userId: { in: userIds },
          deleted: null,
          harvestingDate: { gte: nowDate, lte: in7Days },
        },
        select: { userId: true, cropName: true, harvestingDate: true },
      }),
      prisma.subsidyRecord.findMany({
        where: {
          userId: { in: userIds },
          status: { not: 'RECEIVED' },
          deadline: { gte: nowDate, lte: in7Days },
        },
        select: { userId: true, subsidyName: true, deadline: true },
      }),
    ]);

    // Index by userId for O(1) lookup
    const plansByUser = new Map<string, typeof duePlans>();
    for (const plan of duePlans) {
      const list = plansByUser.get(plan.userId) ?? [];
      list.push(plan);
      plansByUser.set(plan.userId, list);
    }
    const harvestByUser = new Map<string, typeof nearHarvestCrops>();
    for (const crop of nearHarvestCrops) {
      const list = harvestByUser.get(crop.userId) ?? [];
      list.push(crop);
      harvestByUser.set(crop.userId, list);
    }
    const subsidyByUser = new Map<string, typeof dueSubsidies>();
    for (const sub of dueSubsidies) {
      const list = subsidyByUser.get(sub.userId) ?? [];
      list.push(sub);
      subsidyByUser.set(sub.userId, list);
    }

    let emailsSent = 0;
    const log: string[] = [];

    for (const user of users) {
      if (!user.email) {
        log.push(`Skipped ${user.name ?? user.id}: no email address on file`);
        continue;
      }

      const alerts: string[] = [];

      for (const plan of plansByUser.get(user.id) ?? []) {
        const days = daysFromNow(plan.plannedDate, now);
        alerts.push(
          `• Fertilization plan due in ${days} day(s): ${plan.fertilizer} on ${plan.crop.cropName} (${plan.plannedDate.toISOString().slice(0, 10)})`
        );
      }

      for (const crop of harvestByUser.get(user.id) ?? []) {
        if (!crop.harvestingDate) continue;
        const days = daysFromNow(crop.harvestingDate, now);
        alerts.push(
          `• Harvest approaching in ${days} day(s): ${crop.cropName} (${crop.harvestingDate.toISOString().slice(0, 10)})`
        );
      }

      for (const sub of subsidyByUser.get(user.id) ?? []) {
        if (!sub.deadline) continue;
        const days = daysFromNow(sub.deadline, now);
        alerts.push(
          `• Subsidy deadline in ${days} day(s): ${sub.subsidyName} (${sub.deadline.toISOString().slice(0, 10)})`
        );
      }

      if (alerts.length === 0) continue;

      const subject = `Farm Alert: ${alerts.length} upcoming event(s)`;
      const text = [
        `Hello ${user.name},`,
        '',
        'You have upcoming farm events that need your attention:',
        '',
        ...alerts,
        '',
        'Log in to your Farm Management Platform to take action.',
      ].join('\n');

      try {
        await sendEmail(user.email, subject, text);
        emailsSent++;
        log.push(`Sent to [user]: ${alerts.length} alert(s)`);
      } catch (err) {
        log.push(`Failed to send to [user]: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return Response.json({
      processed: users.length,
      emailsSent,
      smtpConfigured: isSmtpConfigured(),
      log,
    });
  } catch (error) {
    console.error('Notifications cron error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
