import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';
import { ApiResponse } from 'app/types/api';
import { checkAiRateLimit, logAiUsage } from 'app/lib/ai/rateLimit';
import { generateFertilizationInsight } from 'app/lib/ai/fertilizationInsights';
import { FertilizationService } from 'app/SoilManagement/services/fertilizationService';

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      const response: ApiResponse = { error: 'User not found or not properly authenticated', status: 401 };
      return Response.json(response, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const cropId = Number(body?.cropId);
    const soilTestId = Number(body?.soilTestId);
    if (!Number.isInteger(cropId) || cropId <= 0 || !Number.isInteger(soilTestId) || soilTestId <= 0) {
      const response: ApiResponse = { error: 'A valid cropId and soilTestId are required.', status: 400 };
      return Response.json(response, { status: 400 });
    }

    const [crop, soilTest] = await Promise.all([
      prisma.crop.findFirst({ where: { id: cropId, deleted: null } }),
      prisma.soilTest.findFirst({ where: { id: soilTestId, userId: user.id } })
    ]);

    if (!crop) {
      const response: ApiResponse = { error: 'Crop not found.', status: 404 };
      return Response.json(response, { status: 404 });
    }
    if (!soilTest) {
      const response: ApiResponse = { error: 'Soil test not found.', status: 404 };
      return Response.json(response, { status: 404 });
    }

    const rateLimit = await checkAiRateLimit(user.id, 'FERTILIZATION_INSIGHT');
    if (!rateLimit.allowed) {
      await logAiUsage(user.id, 'FERTILIZATION_INSIGHT', `crop:${cropId}`, 'RATE_LIMITED', cropId);
      const response: ApiResponse = { error: rateLimit.reason, status: 429 };
      return Response.json(response, { status: 429 });
    }

    const season = FertilizationService.getSeason(new Date());
    const cropForCalc = {
      id: crop.id,
      cropName: crop.cropName,
      nitrogenDemand: Number(crop.nitrogenDemand),
      nitrogenSupply: Number(crop.nitrogenSupply),
      soilResidualNitrogen: crop.soilResidualNitrogen ? Number(crop.soilResidualNitrogen) : undefined
    };
    const soilTestForCalc = {
      pH: Number(soilTest.pH),
      organicMatter: Number(soilTest.organicMatter),
      nitrogen: Number(soilTest.nitrogen),
      phosphorus: Number(soilTest.phosphorus),
      potassium: Number(soilTest.potassium),
      texture: soilTest.texture
    };

    const recommendation = FertilizationService.getFertilizerRecommendation(cropForCalc, soilTestForCalc, season);
    const nitrogenRequirement = FertilizationService.calculateNitrogenRequirement(cropForCalc, soilTestForCalc, season);

    let insight;
    try {
      insight = await generateFertilizationInsight({
        cropName: cropForCalc.cropName,
        cropType: crop.cropType,
        season,
        fieldLocation: soilTest.fieldLocation,
        soilTexture: soilTestForCalc.texture,
        soilPh: soilTestForCalc.pH,
        organicMatter: soilTestForCalc.organicMatter,
        soilNitrogen: soilTestForCalc.nitrogen,
        nitrogenRequirement,
        recommendation: {
          fertilizer: recommendation.fertilizer,
          applicationRate: recommendation.applicationRate,
          applicationMethod: recommendation.applicationMethod,
          timing: recommendation.timing
        },
        notes: soilTest.notes || undefined
      });
    } catch (error) {
      console.error('AI fertilization insight error:', error);
      await logAiUsage(user.id, 'FERTILIZATION_INSIGHT', `crop:${cropId}`, 'ERROR', cropId);
      const response: ApiResponse = { error: 'AI insight is temporarily unavailable. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    if (!insight) {
      await logAiUsage(user.id, 'FERTILIZATION_INSIGHT', `crop:${cropId}`, 'ERROR', cropId);
      const response: ApiResponse = { error: 'AI insight is temporarily unavailable. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    await logAiUsage(user.id, 'FERTILIZATION_INSIGHT', `crop:${cropId}`, 'SUCCESS', cropId);

    return Response.json({ insight, status: 200 });
  } catch (error) {
    console.error('POST fertilization insight error:', error);
    const response: ApiResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
