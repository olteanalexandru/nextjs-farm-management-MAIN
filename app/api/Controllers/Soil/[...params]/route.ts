import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getSession } from "@auth0/nextjs-auth0";

const prisma = new PrismaClient();

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
            ...data,
            userId: user.id,
          },
        });
        return NextResponse.json(newSoilTest);

      case "fertilizationPlan":
        const newFertilizationPlan = await prisma.fertilizationPlan.create({
          data: {
            ...data,
            userId: user.id,
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
          where: {
            id: parseInt(id),
            userId: user.id,
          },
          data,
        });
        return NextResponse.json(updatedSoilTest);

      case "fertilizationPlan":
        const updatedFertilizationPlan = await prisma.fertilizationPlan.update({
          where: {
            id: parseInt(id),
            userId: user.id,
          },
          data,
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
