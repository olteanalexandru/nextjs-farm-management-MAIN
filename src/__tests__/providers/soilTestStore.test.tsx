import { renderHook, act } from '@testing-library/react';
import { SoilTestProvider, useSoilTests } from '@/providers/soilTestStore';

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
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  test('full soil test lifecycle', async () => {
    // Mock successful responses
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockSoilTest])
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSoilTest)
      }));

    const { result } = renderHook(() => useSoilTests(), {
      wrapper: SoilTestProvider
    });

    // Test fetching soil tests
    await act(async () => {
      const tests = await result.current.fetchSoilTests();
      expect(tests).toEqual([mockSoilTest]);
    });

    // Test creating a new soil test
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

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/Controllers/Soil/soilTest',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      })
    );
  });

  test('handles API errors appropriately', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.reject(new Error('API Error'))
    );

    const { result } = renderHook(() => useSoilTests(), {
      wrapper: SoilTestProvider
    });

    await expect(result.current.fetchSoilTests()).rejects.toThrow('API Error');
  });
});
