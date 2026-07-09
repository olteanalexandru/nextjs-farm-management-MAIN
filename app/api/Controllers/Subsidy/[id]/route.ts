import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

const VALID_STATUSES = ['PLANNED', 'APPLIED', 'APPROVED', 'REJECTED', 'RECEIVED'];
const VALID_TYPES = ['AREA_PAYMENT', 'RURAL_DEVELOPMENT', 'AGRI_ENVIRONMENT', 'YOUNG_FARMER', 'OTHER'];

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.subsidyRecord.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.subsidyName !== undefined) data.subsidyName = String(body.subsidyName).trim();
    if (body.subsidyType !== undefined) {
      if (!VALID_TYPES.includes(body.subsidyType)) {
        return Response.json({ error: `subsidyType must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
      }
      data.subsidyType = String(body.subsidyType);
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return Response.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
      }
      data.status = String(body.status);
    }
    if (body.amount !== undefined) data.amount = body.amount != null ? Number(body.amount) : null;
    if (body.currency !== undefined) data.currency = String(body.currency);
    if (body.applicationDate !== undefined) data.applicationDate = body.applicationDate ? new Date(body.applicationDate) : null;
    if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

    const record = await prisma.subsidyRecord.update({ where: { id }, data });
    return Response.json({ record });
  } catch (error) {
    console.error('PUT subsidy error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.subsidyRecord.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    await prisma.subsidyRecord.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE subsidy error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
