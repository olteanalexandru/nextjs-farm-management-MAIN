import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, CropModel, DetailType, Crop } from 'app/types/api';

// DELETE routes are:
// 1. crops/cropId
// 2. crops/userId/cropId



export const DELETE = withApiAuthRequired(async function DELETE(
    request: NextRequest,
    { params }: { params: { params: string[] } }
  ) {
    try {
      const [action, userId, cropId] = params.params;
  
      if (action === 'crops') {
        const user = await getCurrentUser(request);
        
        // Ensure cropId is a valid number
        const numericCropId = parseInt(cropId);
        if (isNaN(numericCropId)) {
          const response: ApiResponse = { 
            error: 'Invalid crop ID',
            status: 400
          };
          return Response.json(response, { status: 400 });
        }
  
        const crop = await prisma.crop.findUnique({
          where: { 
            id: numericCropId
          }
        });
  
        if (!crop) {
          const response: ApiResponse = { 
            error: 'Crop not found',
            status: 404
          };
          return Response.json(response, { status: 404 });
        }
  
        if (crop.userId !== user.id) {
          const response: ApiResponse = { 
            error: 'Not authorized',
            status: 401
          };
          return Response.json(response, { status: 401 });
        }
  
        // Use a transaction to delete related records first
        await prisma.$transaction([
          // Delete related crop details
          prisma.cropDetail.deleteMany({
            where: { cropId: numericCropId }
          }),
          // Delete related user crop selections
          prisma.userCropSelection.deleteMany({
            where: { cropId: numericCropId }
          }),
          // Delete related rotation plans
          prisma.rotationPlan.deleteMany({
            where: { cropId: numericCropId }
          }),
          // Finally delete the crop
          prisma.crop.delete({
            where: { id: numericCropId }
          })
        ]);
  
        const response: ApiResponse = { 
          message: 'Crop deleted successfully',
          status: 200
        };
        return Response.json(response);
      }
  
      const response: ApiResponse = { 
        error: 'Invalid route',
        status: 400
      };
      return Response.json(response, { status: 400 });
    } catch (error) {
      console.error('DELETE request error:', error);
      const response: ApiResponse = { 
        error: error instanceof Error ? error.message : 'Internal server error',
        status: 500
      };
      return Response.json(response, { status: 500 });
    }
  });