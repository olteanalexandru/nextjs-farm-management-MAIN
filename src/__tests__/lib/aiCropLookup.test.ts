import { describe, test, expect } from 'vitest';
import { sanitizeCropNameQuery } from '@/lib/ai/cropNameValidation';
import { validateAiCropResult } from '@/lib/ai/cropLookup';

describe('sanitizeCropNameQuery', () => {
  test('trims and collapses internal whitespace', () => {
    expect(sanitizeCropNameQuery('  Sweet   Corn  ')).toBe('Sweet Corn');
  });

  test('accepts diacritics used in non-English crop names', () => {
    expect(sanitizeCropNameQuery('Pătlăgele roșii')).toBe('Pătlăgele roșii');
  });

  test('accepts hyphenated and parenthetical variety names', () => {
    expect(sanitizeCropNameQuery("Pak-choi (Bok choy)")).toBe("Pak-choi (Bok choy)");
  });

  test('rejects empty or whitespace-only input', () => {
    expect(sanitizeCropNameQuery('')).toBeNull();
    expect(sanitizeCropNameQuery('   ')).toBeNull();
  });

  test('rejects input shorter than 2 characters', () => {
    expect(sanitizeCropNameQuery('T')).toBeNull();
  });

  test('rejects input longer than 60 characters', () => {
    expect(sanitizeCropNameQuery('A'.repeat(61))).toBeNull();
  });

  test('rejects code-like / non-crop-name characters', () => {
    expect(sanitizeCropNameQuery('<script>alert(1)</script>')).toBeNull();
    expect(sanitizeCropNameQuery('Tomato; DROP TABLE crops;')).toBeNull();
    expect(sanitizeCropNameQuery('{"isCrop": true}')).toBeNull();
  });

  test('rejects non-string input', () => {
    expect(sanitizeCropNameQuery(undefined as unknown as string)).toBeNull();
    expect(sanitizeCropNameQuery(123 as unknown as string)).toBeNull();
  });
});

describe('validateAiCropResult', () => {
  const validResult = {
    isCrop: true,
    cropName: 'Quinoa',
    cropType: 'GRAIN',
    soilType: 'LOAM',
    climate: 'Temperate',
    description: 'A grain crop grown for its edible seeds.',
    nitrogenSupply: 40,
    nitrogenDemand: 120,
    itShouldNotBeRepeatedForXYears: 3,
    fertilizers: ['Compost', 'NPK 10-10-10'],
    pests: ['Aphids'],
    diseases: ['Downy mildew']
  };

  test('accepts a well-formed crop result', () => {
    const result = validateAiCropResult(validResult);
    expect(result).toMatchObject({
      cropName: 'Quinoa',
      cropType: 'GRAIN',
      soilType: 'LOAM',
      nitrogenSupply: 40,
      nitrogenDemand: 120
    });
  });

  test('rejects when isCrop is false', () => {
    expect(validateAiCropResult({ ...validResult, isCrop: false })).toBeNull();
  });

  test('rejects non-object input', () => {
    expect(validateAiCropResult(null)).toBeNull();
    expect(validateAiCropResult(undefined)).toBeNull();
    expect(validateAiCropResult('not an object')).toBeNull();
  });

  test('rejects when cropName is missing or empty', () => {
    expect(validateAiCropResult({ ...validResult, cropName: '' })).toBeNull();
    expect(validateAiCropResult({ ...validResult, cropName: '   ' })).toBeNull();
  });

  test('falls back to OTHER/LOAM for unrecognized enum values', () => {
    const result = validateAiCropResult({
      ...validResult,
      cropType: 'NOT_A_REAL_TYPE',
      soilType: 'NOT_A_REAL_SOIL'
    });
    expect(result?.cropType).toBe('OTHER');
    expect(result?.soilType).toBe('LOAM');
  });

  test('clamps nitrogen values into the [0, 400] range', () => {
    const result = validateAiCropResult({
      ...validResult,
      nitrogenSupply: -50,
      nitrogenDemand: 99999
    });
    expect(result?.nitrogenSupply).toBe(0);
    expect(result?.nitrogenDemand).toBe(400);
  });

  test('clamps rotation interval into the [0, 10] range', () => {
    const result = validateAiCropResult({
      ...validResult,
      itShouldNotBeRepeatedForXYears: 999
    });
    expect(result?.itShouldNotBeRepeatedForXYears).toBe(10);
  });

  test('truncates description to 500 characters', () => {
    const result = validateAiCropResult({
      ...validResult,
      description: 'A'.repeat(600)
    });
    expect(result?.description.length).toBe(500);
  });

  test('caps list fields to 6 items and filters non-string entries', () => {
    const result = validateAiCropResult({
      ...validResult,
      pests: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 123, null]
    });
    expect(result?.pests).toHaveLength(6);
    expect(result?.pests.every((p) => typeof p === 'string')).toBe(true);
  });

  test('handles non-array list fields gracefully', () => {
    const result = validateAiCropResult({ ...validResult, fertilizers: 'not-an-array' });
    expect(result?.fertilizers).toEqual([]);
  });
});
