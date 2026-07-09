import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const equipment = await prisma.equipment.findFirst({ where: { id, userId: user.id } });
    if (!equipment) return Response.json({ error: 'Not found' }, { status: 404 });

    const logs = await prisma.equipmentMaintenanceLog.findMany({
      where: { equipmentId: id, userId: user.id },
      orderBy: { logDate: 'desc' },
    });
    return Response.json({ logs });
  } catch (error) {
    console.error('GET maintenance logs error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const id = Number(params.id);
    if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

    const equipment = await prisma.equipment.findFirst({ where: { id, userId: user.id } });
    if (!equipment) return Response.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    if (!body.logDate) return Response.json({ error: 'logDate is required' }, { status: 400 });
    if (!body.description?.trim()) return Response.json({ error: 'description is required' }, { status: 400 });

    const log = await prisma.equipmentMaintenanceLog.create({
      data: {
        userId: user.id,
        equipmentId: id,
        logDate: new Date(body.logDate),
        description: String(body.description).trim(),
        cost: body.cost != null ? Number(body.cost) : null,
        hoursAtService: body.hoursAtService != null ? Number(body.hoursAtService) : null,
        notes: body.notes ? String(body.notes) : null,
      }
    });
    return Response.json({ log }, { status: 201 });
  } catch (error) {
    console.error('POST maintenance log error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
