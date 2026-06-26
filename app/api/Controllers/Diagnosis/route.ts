import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse } from 'app/types/api';
import { checkAiRateLimit, logAiUsage } from 'app/lib/ai/rateLimit';
import { sanitizeSymptomDescription } from 'app/lib/ai/symptomValidation';
import { sanitizeCropNameQuery } from 'app/lib/ai/cropNameValidation';
import { diagnosePestOrDisease } from 'app/lib/ai/pestDiagnosis';

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      const response: ApiResponse = { error: 'User not found or not properly authenticated', status: 401 };
      return Response.json(response, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const symptomDescription = sanitizeSymptomDescription(String(body?.symptomDescription ?? ''));
    if (!symptomDescription) {
      const response: ApiResponse = { error: 'Please describe the symptoms in 10-800 characters.', status: 400 };
      return Response.json(response, { status: 400 });
    }

    const rawCropName = body?.cropName ? String(body.cropName) : '';
    const cropName = rawCropName ? sanitizeCropNameQuery(rawCropName) : null;
    if (rawCropName && !cropName) {
      const response: ApiResponse = { error: 'Please provide a valid crop name (2-60 letters) or leave it blank.', status: 400 };
      return Response.json(response, { status: 400 });
    }

    const rateLimit = await checkAiRateLimit(user.id, 'PEST_DIAGNOSIS', user.subscriptionTier === 'PREMIUM' ? 'PREMIUM' : 'FREE');
    if (!rateLimit.allowed) {
      await logAiUsage(user.id, 'PEST_DIAGNOSIS', symptomDescription, 'RATE_LIMITED');
      const response: ApiResponse = { error: rateLimit.reason, status: 429, upgradeRecommended: rateLimit.upgradeRecommended };
      return Response.json(response, { status: 429 });
    }

    let result;
    try {
      result = await diagnosePestOrDisease({
        cropName: cropName || undefined,
        symptomDescription
      });
    } catch (error) {
      console.error('AI pest diagnosis error:', error);
      await logAiUsage(user.id, 'PEST_DIAGNOSIS', symptomDescription, 'ERROR');
      const response: ApiResponse = { error: 'AI diagnosis is temporarily unavailable. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    if (!result) {
      await logAiUsage(user.id, 'PEST_DIAGNOSIS', symptomDescription, 'ERROR');
      const response: ApiResponse = { error: 'AI diagnosis is temporarily unavailable. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    await logAiUsage(user.id, 'PEST_DIAGNOSIS', symptomDescription, result.isAgricultural ? 'SUCCESS' : 'REJECTED');

    return Response.json({ result, status: 200 });
  } catch (error) {
    console.error('POST pest diagnosis error:', error);
    const response: ApiResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
