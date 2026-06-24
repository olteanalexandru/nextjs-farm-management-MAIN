import { describe, test, expect } from 'vitest';
import { validateRotationInsight } from '@/lib/ai/rotationInsights';

describe('validateRotationInsight', () => {
  const validResult = {
    summary: 'This rotation maintains a healthy nitrogen balance across all divisions.',
    risks: ['Repeating legumes too often can reduce soil diversity.'],
    tips: ['Alternate deep and shallow rooted crops to improve soil structure.']
  };

  test('accepts a well-formed insight', () => {
    const result = validateRotationInsight(validResult);
    expect(result).toMatchObject({
      summary: validResult.summary,
      risks: validResult.risks,
      tips: validResult.tips
    });
  });

  test('rejects non-object input', () => {
    expect(validateRotationInsight(null)).toBeNull();
    expect(validateRotationInsight(undefined)).toBeNull();
    expect(validateRotationInsight('not an object')).toBeNull();
  });

  test('rejects when summary is missing or empty', () => {
    expect(validateRotationInsight({ ...validResult, summary: '' })).toBeNull();
    expect(validateRotationInsight({ ...validResult, summary: '   ' })).toBeNull();
  });

  test('truncates summary to 400 characters', () => {
    const result = validateRotationInsight({ ...validResult, summary: 'A'.repeat(500) });
    expect(result?.summary.length).toBe(400);
  });

  test('caps list fields to 5 items, truncates length, and filters non-string entries', () => {
    const result = validateRotationInsight({
      ...validResult,
      risks: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 123, null, 'B'.repeat(200)]
    });
    expect(result?.risks).toHaveLength(5);
    expect(result?.risks.every((r) => typeof r === 'string' && r.length <= 150)).toBe(true);
  });

  test('handles non-array list fields gracefully', () => {
    const result = validateRotationInsight({ ...validResult, tips: 'not-an-array' });
    expect(result?.tips).toEqual([]);
  });
});
