import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse,  Crop, RecommendationResponse } from 'app/types/api';
import {  transformCropWithDetails } from '@/api/Controllers/Crop/[...params]/helpers';
import {
    WikiQueryParams
     } from '@/api/Controllers/Crop/crops/wiki/types';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {

      const url = new URL(request.url);
      const queryParams: WikiQueryParams = {
        page: Math.max(1, parseInt(url.searchParams.get('page') || '1')),
        limit: Math.max(1, parseInt(url.searchParams.get('limit') || '10')),
        search: url.searchParams.get('search') || undefined,
        sortBy: url.searchParams.get('sortBy') || 'cropName',
        sortOrder: (url.searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
        cropType: url.searchParams.get('cropType') || undefined,
        soilType: url.searchParams.get('soilType') || undefined,
      };
    
      const skip = (queryParams.page - 1) * queryParams.limit;
    
      const whereClause = {
        deleted: null,
        cropType: {
          not: 'RECOMMENDATION' // Exclude recommendations
        },
        ...(queryParams.search && {
          cropName: {
            contains: queryParams.search,
            mode: 'insensitive'
          }
        }),
        ...(queryParams.cropType && {
          cropType: queryParams.cropType
        }),
        ...(queryParams.soilType && {
          soilType: queryParams.soilType
        })
      };
    
      // Ensure sortBy is a valid column name
      const validSortColumns = ['cropName', 'cropType', 'soilType', 'createdAt'];
      const sortBy = validSortColumns.includes(queryParams.sortBy) 
        ? queryParams.sortBy 
        : 'cropName';
    
      const [crops, totalCount] = await Promise.all([
        prisma.crop.findMany({
          where: whereClause,
          include: {
            details: true,
          },
          skip,
          take: queryParams.limit,
          orderBy: {
            [sortBy]: queryParams.sortOrder
          }
        }),
        prisma.crop.count({ where: whereClause })
      ]);
    
      const transformedCrops = crops.map(transformCropWithDetails);
      
      const response = {
        crops: transformedCrops,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / queryParams.limit)
        }
      };
    
      return Response.json(response);
    
    } catch (error) {
        return new Response(null, { status: 500, statusText: error.message });
        }
    
};
