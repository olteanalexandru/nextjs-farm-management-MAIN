import { renderHook, act } from '@testing-library/react';
import { FertilizationPlanProvider, useFertilizationPlans } from '@/app/providers/fertilizationPlanStore';

describe('FertilizationPlanStore', () => {
  const mockPlan = {
    id: 1,
    plannedDate: '2023-01-01',
    fertilizer: 'Test Fertilizer',
    applicationRate: 100,
    nitrogenContent: 30,
    applicationMethod: 'broadcast',
    crop: { id: 1, cropName: 'Test Crop' }
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('fetchFertilizationPlans retrieves plans', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockPlan]
    });

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    await act(async () => {
      await result.current.fetchFertilizationPlans();
    });

    expect(result.current.plans).toEqual([mockPlan]);
    expect(result.current.error).toBeNull();
  });

  test('saveFertilizationPlan handles creation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlan
    });

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    const formData = {
      cropId: '1',
      plannedDate: '2023-01-01',
      fertilizer: 'Test Fertilizer',
      applicationRate: '100',
      nitrogenContent: '30',
      applicationMethod: 'broadcast'
    };

    await act(async () => {
      await result.current.saveFertilizationPlan(null, formData);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/Controllers/Soil/fertilizationPlan',
      expect.any(Object)
    );
  });
});

describe('FertilizationPlanStore Integration', () => {
  const mockPlan = {
    id: 1,
    cropId: 1,
    plannedDate: '2023-01-01',
    fertilizer: 'Test Fertilizer',
    applicationRate: 100,
    nitrogenContent: 30,
    applicationMethod: 'broadcast',
    notes: 'Test notes',
    completed: false,
    crop: { id: 1, cropName: 'Test Crop' }
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('complete fertilization plan lifecycle', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockPlan])
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPlan)
      }));

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    // Test fetching plans
    await act(async () => {
      const plans = await result.current.fetchFertilizationPlans();
      expect(plans).toEqual([mockPlan]);
    });

    // Test creating a new plan
    const newPlanData = {
      cropId: '1',
      plannedDate: '2023-02-01',
      fertilizer: 'New Fertilizer',
      applicationRate: '150',
      nitrogenContent: '35',
      applicationMethod: 'foliar',
      notes: 'New test'
    };

    await act(async () => {
      await result.current.saveFertilizationPlan(null, newPlanData);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/Controllers/Soil/fertilizationPlan',
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

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    await act(async () => {
      try {
        await result.current.fetchFertilizationPlans();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.error).toBeDefined();
  });
});
