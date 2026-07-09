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

function daysFromNow(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 86400000);
    const in7Days = new Date(now.getTime() + 7 * 86400000);

    // Fetch users who need notifications
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });

    let emailsSent = 0;
    const log: string[] = [];

    for (const user of users) {
      const alerts: string[] = [];

      // Fertilization plans due within 3 days
      const duePlans = await prisma.fertilizationPlan.findMany({
        where: {
          userId: user.id,
          completed: false,
          plannedDate: { gte: now, lte: in3Days },
        },
        include: { crop: { select: { cropName: true } } },
      });

      for (const plan of duePlans) {
        const days = daysFromNow(plan.plannedDate);
        alerts.push(
          `• Fertilization plan due in ${days} day(s): ${plan.fertilizer} on ${plan.crop.cropName} (${plan.plannedDate.toISOString().slice(0, 10)})`
        );
      }

      // Crops with harvest date within 7 days
      const nearHarvest = await prisma.crop.findMany({
        where: {
          userId: user.id,
          deleted: null,
          harvestingDate: { gte: now, lte: in7Days },
        },
      });

      for (const crop of nearHarvest) {
        if (!crop.harvestingDate) continue;
        const days = daysFromNow(crop.harvestingDate);
        alerts.push(
          `• Harvest approaching in ${days} day(s): ${crop.cropName} (${crop.harvestingDate.toISOString().slice(0, 10)})`
        );
      }

      // Subsidy deadlines within 7 days
      const dueSubsidies = await prisma.subsidyRecord.findMany({
        where: {
          userId: user.id,
          status: { not: 'RECEIVED' },
          deadline: { gte: now, lte: in7Days },
        },
      });

      for (const sub of dueSubsidies) {
        if (!sub.deadline) continue;
        const days = daysFromNow(sub.deadline);
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
        log.push(`Sent to ${user.email}: ${alerts.length} alert(s)`);
      } catch (err) {
        log.push(`Failed to send to ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
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
