import { NextRequest, NextResponse } from "next/server";
import { prisma } from "app/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const [action, ...args] = params.params;

    switch (action) {
      case "soilTests":
        const soilTests = await prisma.soilTest.findMany({
          where: { userId: user.id },
          orderBy: { testDate: "desc" },
        });
        return NextResponse.json(soilTests);

      case "soilTest":
        const testId = parseInt(args[0]);
        const soilTest = await prisma.soilTest.findFirst({
          where: { id: testId, userId: user.id },
        });
        return NextResponse.json(soilTest);

      case "fertilizationPlans":
        const fertilizationPlans = await prisma.fertilizationPlan.findMany({
          where: { userId: user.id },
          include: { crop: true },
          orderBy: { plannedDate: "desc" },
        });
        return NextResponse.json(fertilizationPlans);

      case "fertilizationPlan":
        const planId = parseInt(args[0]);
        const fertilizationPlan = await prisma.fertilizationPlan.findFirst({
          where: { id: planId, userId: user.id },
          include: { crop: true },
        });
        return NextResponse.json(fertilizationPlan);

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in soil management GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const [action] = params.params;
    const data = await request.json();

    switch (action) {
      case "soilTest":
        const newSoilTest = await prisma.soilTest.create({
          data: {
            userId: user.id,
            testDate: new Date(data.testDate),
            fieldLocation: String(data.fieldLocation),
            pH: Number(data.pH),
            organicMatter: Number(data.organicMatter),
            nitrogen: Number(data.nitrogen),
            phosphorus: Number(data.phosphorus),
            potassium: Number(data.potassium),
            calcium: data.calcium != null ? Number(data.calcium) : null,
            magnesium: data.magnesium != null ? Number(data.magnesium) : null,
            sulfur: data.sulfur != null ? Number(data.sulfur) : null,
            cec: data.cec != null ? Number(data.cec) : null,
            texture: String(data.texture),
            notes: data.notes != null ? String(data.notes) : null,
          },
        });
        return NextResponse.json(newSoilTest);

      case "fertilizationPlan":
        const newFertilizationPlan = await prisma.fertilizationPlan.create({
          data: {
            userId: user.id,
            cropId: Number(data.cropId),
            plannedDate: new Date(data.plannedDate),
            fertilizer: String(data.fertilizer),
            applicationRate: Number(data.applicationRate),
            nitrogenContent: Number(data.nitrogenContent),
            applicationMethod: String(data.applicationMethod),
            notes: data.notes != null ? String(data.notes) : null,
          },
        });
        return NextResponse.json(newFertilizationPlan);

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in soil management POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const [action, id] = params.params;
    const data = await request.json();

    switch (action) {
      case "soilTest":
        const updatedSoilTest = await prisma.soilTest.update({
          where: { id: parseInt(id), userId: user.id },
          data: {
            ...(data.testDate != null && { testDate: new Date(data.testDate) }),
            ...(data.fieldLocation != null && { fieldLocation: String(data.fieldLocation) }),
            ...(data.pH != null && { pH: Number(data.pH) }),
            ...(data.organicMatter != null && { organicMatter: Number(data.organicMatter) }),
            ...(data.nitrogen != null && { nitrogen: Number(data.nitrogen) }),
            ...(data.phosphorus != null && { phosphorus: Number(data.phosphorus) }),
            ...(data.potassium != null && { potassium: Number(data.potassium) }),
            ...(data.calcium !== undefined && { calcium: data.calcium != null ? Number(data.calcium) : null }),
            ...(data.magnesium !== undefined && { magnesium: data.magnesium != null ? Number(data.magnesium) : null }),
            ...(data.sulfur !== undefined && { sulfur: data.sulfur != null ? Number(data.sulfur) : null }),
            ...(data.cec !== undefined && { cec: data.cec != null ? Number(data.cec) : null }),
            ...(data.texture != null && { texture: String(data.texture) }),
            ...(data.notes !== undefined && { notes: data.notes != null ? String(data.notes) : null }),
          },
        });
        return NextResponse.json(updatedSoilTest);

      case "fertilizationPlan":
        const updatedFertilizationPlan = await prisma.fertilizationPlan.update({
          where: { id: parseInt(id), userId: user.id },
          data: {
            ...(data.cropId != null && { cropId: Number(data.cropId) }),
            ...(data.plannedDate != null && { plannedDate: new Date(data.plannedDate) }),
            ...(data.fertilizer != null && { fertilizer: String(data.fertilizer) }),
            ...(data.applicationRate != null && { applicationRate: Number(data.applicationRate) }),
            ...(data.nitrogenContent != null && { nitrogenContent: Number(data.nitrogenContent) }),
            ...(data.applicationMethod != null && { applicationMethod: String(data.applicationMethod) }),
            ...(data.notes !== undefined && { notes: data.notes != null ? String(data.notes) : null }),
            ...(data.completed !== undefined && { completed: Boolean(data.completed) }),
            ...(data.completedDate !== undefined && { completedDate: data.completedDate != null ? new Date(data.completedDate) : null }),
          },
        });
        return NextResponse.json(updatedFertilizationPlan);

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in soil management PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const [action, id] = params.params;

    switch (action) {
      case "soilTest":
        await prisma.soilTest.delete({
          where: {
            id: parseInt(id),
            userId: user.id,
          },
        });
        return NextResponse.json({ success: true });

      case "fertilizationPlan":
        await prisma.fertilizationPlan.delete({
          where: {
            id: parseInt(id),
            userId: user.id,
          },
        });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in soil management DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
