import { renderHook, act } from '@testing-library/react';
import { SoilTestProvider, useSoilTests } from '@/providers/soilTestStore';
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SoilTestStore Integration', () => {
  const mockSoilTest = {
    id: 1,
    testDate: '2023-01-01',
    fieldLocation: 'Test Field',
    pH: 6.5,
    organicMatter: 2.5,
    nitrogen: 20,
    phosphorus: 30,
    potassium: 40,
    texture: 'loamy',
    notes: 'Test notes'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('full soil test lifecycle', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [mockSoilTest] });
    mockedAxios.post.mockResolvedValueOnce({ data: mockSoilTest });

    const { result } = renderHook(() => useSoilTests(), {
      wrapper: SoilTestProvider
    });

    await act(async () => {
      const tests = await result.current.fetchSoilTests();
      expect(tests).toEqual([mockSoilTest]);
    });

    const newTestData = {
      testDate: '2023-02-01',
      fieldLocation: 'New Field',
      pH: '7.0',
      organicMatter: '3.0',
      nitrogen: '25',
      phosphorus: '35',
      potassium: '45',
      texture: 'sandy',
      notes: 'New test'
    };

    await act(async () => {
      await result.current.saveSoilTest(null, newTestData);
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/Controllers/Soil/soilTest',
      expect.objectContaining({
        testDate: expect.any(String),
        fieldLocation: 'New Field',
        pH: 7.0,
        organicMatter: 3.0,
        nitrogen: 25,
        phosphorus: 35,
        potassium: 45,
        texture: 'sandy',
        notes: 'New test'
      })
    );
  });

  test('handles API errors appropriately', async () => {
    const error = new Error('API Error');
    mockedAxios.get.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSoilTests(), {
      wrapper: SoilTestProvider
    });

    await act(async () => {
      await expect(result.current.fetchSoilTests()).rejects.toThrow('API Error');
    });

    expect(result.current.error).toBe('API Error');
  });
});
