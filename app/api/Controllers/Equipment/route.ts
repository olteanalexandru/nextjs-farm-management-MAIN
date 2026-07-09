import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const equipment = await prisma.equipment.findMany({
      where: { userId: user.id },
      include: { maintenanceLogs: { orderBy: { logDate: 'desc' }, take: 1 } },
      orderBy: { name: 'asc' },
    });
    return Response.json({ equipment });
  } catch (error) {
    console.error('GET equipment error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    if (!body.name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 });
    if (!body.equipmentType?.trim()) return Response.json({ error: 'equipmentType is required' }, { status: 400 });

    const item = await prisma.equipment.create({
      data: {
        userId: user.id,
        name: String(body.name).trim(),
        equipmentType: String(body.equipmentType).trim(),
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        hoursUsed: body.hoursUsed != null ? Number(body.hoursUsed) : null,
        nextServiceDueAt: body.nextServiceDueAt ? new Date(body.nextServiceDueAt) : null,
        notes: body.notes ? String(body.notes) : null,
      }
    });
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    console.error('POST equipment error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
