import { describe, test, expect } from 'vitest';
import { validateFertilizationInsight } from '@/lib/ai/fertilizationInsights';

describe('validateFertilizationInsight', () => {
  const validResult = {
    summary: 'Urea fits this loamy field well given current soil nitrogen levels.',
    risks: ['Heavy rain shortly after application can leach nitrogen.'],
    tips: ['Split the application if rain is forecast within 48 hours.']
  };

  test('accepts a well-formed insight', () => {
    const result = validateFertilizationInsight(validResult);
    expect(result).toMatchObject({
      summary: validResult.summary,
      risks: validResult.risks,
      tips: validResult.tips
    });
  });

  test('rejects non-object input', () => {
    expect(validateFertilizationInsight(null)).toBeNull();
    expect(validateFertilizationInsight(undefined)).toBeNull();
    expect(validateFertilizationInsight('not an object')).toBeNull();
  });

  test('rejects when summary is missing or empty', () => {
    expect(validateFertilizationInsight({ ...validResult, summary: '' })).toBeNull();
    expect(validateFertilizationInsight({ ...validResult, summary: '   ' })).toBeNull();
  });

  test('truncates summary to 400 characters', () => {
    const result = validateFertilizationInsight({ ...validResult, summary: 'A'.repeat(500) });
    expect(result?.summary.length).toBe(400);
  });

  test('caps list fields to 5 items, truncates length, and filters non-string entries', () => {
    const result = validateFertilizationInsight({
      ...validResult,
      risks: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 123, null, 'B'.repeat(200)]
    });
    expect(result?.risks).toHaveLength(5);
    expect(result?.risks.every((r) => typeof r === 'string' && r.length <= 150)).toBe(true);
  });

  test('handles non-array list fields gracefully', () => {
    const result = validateFertilizationInsight({ ...validResult, tips: 'not-an-array' });
    expect(result?.tips).toEqual([]);
  });
});
