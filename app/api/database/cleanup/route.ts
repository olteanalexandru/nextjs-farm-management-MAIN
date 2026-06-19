import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const targetEmail = 'oltean.alexandru11@gmail.com';

    // First, find the target user
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Delete everything in the correct order to respect foreign key constraints

    // 1. Delete all fertilization plans (references User and Crop)
    await prisma.fertilizationPlan.deleteMany();

    // 2. Delete all soil tests (references User)
    await prisma.soilTest.deleteMany();

    // 3. Delete all rotation plans
    await prisma.rotationPlan.deleteMany();

    // 4. Delete all user crop selections
    await prisma.userCropSelection.deleteMany();

    // 5. Delete all rotations
    await prisma.rotation.deleteMany();

    // 6. Delete all posts
    await prisma.post.deleteMany();

    // 7. Delete all crop details
    await prisma.cropDetail.deleteMany();

    // 8. Delete all crops
    await prisma.crop.deleteMany();

    // 9. Delete all users except target user
    await prisma.user.deleteMany({
      where: {
        NOT: { id: targetUser.id }
      }
    });

    return NextResponse.json({ message: 'Database cleaned successfully' });
  } catch (error) {
    console.error('Database cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to clean database' },
      { status: 500 }
    );
  }
}
