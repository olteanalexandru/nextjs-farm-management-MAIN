import { describe, test, expect } from 'vitest';
import { validatePestDiagnosisResult } from '@/lib/ai/pestDiagnosis';

describe('validatePestDiagnosisResult', () => {
  const validResult = {
    isAgricultural: true,
    candidates: [
      {
        name: 'Aphids',
        type: 'PEST',
        likelihood: 'HIGH',
        description: 'Small sap-sucking insects often found on the underside of leaves.',
        recommendedAction: 'Inspect leaf undersides and consider insecticidal soap if confirmed.'
      }
    ]
  };

  test('accepts a well-formed diagnosis result', () => {
    const result = validatePestDiagnosisResult(validResult);
    expect(result).toMatchObject({
      isAgricultural: true,
      candidates: validResult.candidates
    });
  });

  test('rejects non-object input', () => {
    expect(validatePestDiagnosisResult(null)).toBeNull();
    expect(validatePestDiagnosisResult(undefined)).toBeNull();
    expect(validatePestDiagnosisResult('not an object')).toBeNull();
  });

  test('returns a structured negative result when isAgricultural is false', () => {
    const result = validatePestDiagnosisResult({ isAgricultural: false, candidates: [] });
    expect(result).toEqual({ isAgricultural: false, candidates: [] });
  });

  test('returns a structured negative result when isAgricultural is missing', () => {
    const result = validatePestDiagnosisResult({ candidates: validResult.candidates });
    expect(result).toEqual({ isAgricultural: false, candidates: [] });
  });

  test('falls back to PEST/LOW for unrecognized enum values', () => {
    const result = validatePestDiagnosisResult({
      isAgricultural: true,
      candidates: [
        { ...validResult.candidates[0], type: 'NOT_A_TYPE', likelihood: 'NOT_A_LEVEL' }
      ]
    });
    expect(result?.candidates[0].type).toBe('PEST');
    expect(result?.candidates[0].likelihood).toBe('LOW');
  });

  test('filters out candidates with missing or empty names', () => {
    const result = validatePestDiagnosisResult({
      isAgricultural: true,
      candidates: [{ ...validResult.candidates[0], name: '' }, validResult.candidates[0]]
    });
    expect(result?.candidates).toHaveLength(1);
  });

  test('caps candidates to 5 items and truncates long text fields', () => {
    const longCandidate = {
      name: 'X'.repeat(100),
      type: 'DISEASE',
      likelihood: 'MEDIUM',
      description: 'D'.repeat(400),
      recommendedAction: 'R'.repeat(400)
    };
    const result = validatePestDiagnosisResult({
      isAgricultural: true,
      candidates: Array(8).fill(longCandidate)
    });
    expect(result?.candidates).toHaveLength(5);
    expect(result?.candidates[0].name.length).toBe(80);
    expect(result?.candidates[0].description.length).toBe(300);
    expect(result?.candidates[0].recommendedAction.length).toBe(300);
  });

  test('handles non-array candidates gracefully', () => {
    const result = validatePestDiagnosisResult({ isAgricultural: true, candidates: 'not-an-array' });
    expect(result?.candidates).toEqual([]);
  });
});
