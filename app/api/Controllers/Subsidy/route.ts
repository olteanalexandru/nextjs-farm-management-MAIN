import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_STATUSES = ['PLANNED', 'APPLIED', 'APPROVED', 'REJECTED', 'RECEIVED'];
const VALID_TYPES = ['AREA_PAYMENT', 'RURAL_DEVELOPMENT', 'AGRI_ENVIRONMENT', 'YOUNG_FARMER', 'OTHER'];

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;

    const records = await prisma.subsidyRecord.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {})
      },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }]
    });

    return Response.json({ records });
  } catch (error) {
    console.error('GET subsidy error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    if (!body.subsidyName?.trim()) return Response.json({ error: 'subsidyName is required' }, { status: 400 });
    if (!VALID_TYPES.includes(body.subsidyType)) {
      return Response.json({ error: `subsidyType must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }

    const record = await prisma.subsidyRecord.create({
      data: {
        userId: user.id,
        subsidyName: String(body.subsidyName).trim(),
        subsidyType: String(body.subsidyType),
        amount: body.amount != null ? Number(body.amount) : null,
        currency: body.currency ? String(body.currency) : 'EUR',
        applicationDate: body.applicationDate ? new Date(body.applicationDate) : null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: VALID_STATUSES.includes(body.status) ? String(body.status) : 'PLANNED',
        notes: body.notes ? String(body.notes) : null,
      }
    });

    return Response.json({ record }, { status: 201 });
  } catch (error) {
    console.error('POST subsidy error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
