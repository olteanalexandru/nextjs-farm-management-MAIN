import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import  authenticateUser  from './authenticatedUser';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { params: string[] } }
  ) {
    try {
      const session = await authenticateUser();
      if (session instanceof Response) return session;
      const auth0User = session.user;
  
      // Get database user
      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: auth0User.sub }
      });
  
      if (!dbUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
  
      const [action, id] = params.params;
  
      if (action === 'deleteRotation') {
        const rotationId = parseInt(id);
  
        const rotationRecord = await prisma.rotation.findUnique({
          where: { id: rotationId },
          include: {
            rotationPlans: true
          }
        });
  
        if (!rotationRecord || rotationRecord.userId !== dbUser.id) {
          return Response.json({ error: 'Not authorized' }, { status: 401 });
        }
  
        // Use a transaction to delete rotation plans first, then the rotation
        const deletedRotation = await prisma.$transaction(async (tx) => {
          // First delete all rotation plans
          await tx.rotationPlan.deleteMany({
            where: {
              rotationId: rotationId
            }
          });
  
          // Then delete the rotation
          return tx.rotation.delete({
            where: {
              id: rotationId
            }
          });
        });
  
        return Response.json({
          message: 'Rotation and associated plans deleted successfully',
          data: deletedRotation
        });
      }
  
      return Response.json({ error: 'Invalid route' }, { status: 400 });
    } catch (error) {
      console.error('DELETE request error:', error);
      return Response.json({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }, { status: 500 });
    }
  }