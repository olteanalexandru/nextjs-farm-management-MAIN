import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';
import { ApiResponse, RecommendationResponse } from 'app/types/api';
import { toDecimal, transformCropWithDetails } from '../utils/helpers';
import { sanitizeCropNameQuery } from 'app/lib/ai/cropNameValidation';
import { checkAiRateLimit, logAiUsage } from 'app/lib/ai/rateLimit';
import { lookupCropWithAi } from 'app/lib/ai/cropLookup';

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      const response: ApiResponse = { error: 'User not found or not properly authenticated', status: 401 };
      return Response.json(response, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const query = sanitizeCropNameQuery(String(body?.cropName ?? ''));
    if (!query) {
      const response: ApiResponse = { error: 'Please provide a valid crop name (2-60 letters).', status: 400 };
      return Response.json(response, { status: 400 });
    }

    // Cache-first: if any user has already added/looked up this crop, reuse it
    // instead of spending an AI call.
    const existing = await prisma.crop.findFirst({
      where: { cropName: { equals: query }, deleted: null },
      include: { details: true }
    });
    if (existing) {
      const response: ApiResponse<RecommendationResponse[]> = {
        crops: [transformCropWithDetails(existing)],
        status: 200
      };
      return Response.json(response);
    }

    const rateLimit = await checkAiRateLimit(user.id, 'CROP_LOOKUP');
    if (!rateLimit.allowed) {
      await logAiUsage(user.id, 'CROP_LOOKUP', query, 'RATE_LIMITED');
      const response: ApiResponse = { error: rateLimit.reason, status: 429 };
      return Response.json(response, { status: 429 });
    }

    let aiResult;
    try {
      aiResult = await lookupCropWithAi(query);
    } catch (error) {
      console.error('AI crop lookup error:', error);
      await logAiUsage(user.id, 'CROP_LOOKUP', query, 'ERROR');
      const response: ApiResponse = { error: 'AI lookup is temporarily unavailable. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    if (!aiResult) {
      await logAiUsage(user.id, 'CROP_LOOKUP', query, 'REJECTED');
      const response: ApiResponse = {
        error: `"${query}" doesn't look like a recognized crop. Try a different name or add it manually.`,
        status: 404
      };
      return Response.json(response, { status: 404 });
    }

    const created = await prisma.crop.create({
      data: {
        userId: user.id,
        cropName: aiResult.cropName,
        cropType: aiResult.cropType,
        soilType: aiResult.soilType,
        climate: aiResult.climate,
        description: aiResult.description,
        ItShouldNotBeRepeatedForXYears: aiResult.itShouldNotBeRepeatedForXYears,
        nitrogenSupply: toDecimal(aiResult.nitrogenSupply),
        nitrogenDemand: toDecimal(aiResult.nitrogenDemand),
        aiGenerated: true,
        details: {
          create: [
            ...aiResult.fertilizers.map((value) => ({ value, detailType: 'FERTILIZER' as const })),
            ...aiResult.pests.map((value) => ({ value, detailType: 'PEST' as const })),
            ...aiResult.diseases.map((value) => ({ value, detailType: 'DISEASE' as const }))
          ]
        }
      },
      include: { details: true }
    });

    await logAiUsage(user.id, 'CROP_LOOKUP', query, 'SUCCESS', created.id);

    const response: ApiResponse<RecommendationResponse[]> = {
      crops: [transformCropWithDetails(created)],
      status: 201
    };
    return Response.json(response, { status: 201 });
  } catch (error) {
    console.error('POST AI crop lookup error:', error);
    const response: ApiResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
