import { vi, describe, test, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { configure } from 'mobx';
import { renderHook, act } from '@testing-library/react';
import { FertilizationPlanProvider, useFertilizationPlans } from '@/providers/fertilizationPlanStore';

configure({ enforceActions: 'always' });

vi.mock('axios');
const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>,
  post: ReturnType<typeof vi.fn>,
  put: ReturnType<typeof vi.fn>,
  delete: ReturnType<typeof vi.fn>
};

describe('FertilizationPlanStore', () => {
  const mockPlan = {
    id: 1,
    plannedDate: '2023-01-01',
    fertilizer: 'Test Fertilizer',
    applicationRate: 100,
    nitrogenContent: 30,
    applicationMethod: 'broadcast',
    completed: false,
    crop: { id: 1, cropName: 'Test Crop' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetchFertilizationPlans retrieves plans', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [mockPlan] });

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    await act(async () => {
      await result.current.fetchFertilizationPlans();
    });

    expect(result.current.plans).toEqual([mockPlan]);
    expect(result.current.error).toBeNull();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/Controllers/Soil/fertilizationPlans');
  });

  test('saveFertilizationPlan handles creation', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: mockPlan });
    mockedAxios.get.mockResolvedValueOnce({ data: [mockPlan] });

    const formData = {
      cropId: '1',
      plannedDate: '2023-01-01',
      fertilizer: 'Test Fertilizer',
      applicationRate: '100',
      nitrogenContent: '30',
      applicationMethod: 'broadcast'
    };

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    await act(async () => {
      await result.current.saveFertilizationPlan(null, formData);
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/Controllers/Soil/fertilizationPlan',
      expect.objectContaining({
        cropId: 1,
        plannedDate: expect.any(String),
        fertilizer: 'Test Fertilizer',
        applicationRate: 100,
        nitrogenContent: 30,
        applicationMethod: 'broadcast'
      })
    );
  });

  test('updateFertilizationPlan handles updates', async () => {
    const updateData = {
      fertilizer: 'Updated Fertilizer',
      applicationRate: 150
    };

    mockedAxios.put.mockResolvedValueOnce({ data: { ...mockPlan, ...updateData } });
    mockedAxios.get.mockResolvedValueOnce({ data: [{ ...mockPlan, ...updateData }] });

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    await act(async () => {
      await result.current.updateFertilizationPlan(1, updateData);
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(
      '/api/Controllers/Soil/fertilizationPlan/1',
      updateData
    );
  });

  test('deleteFertilizationPlan removes plan', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    act(() => {
      result.current.setPlans([mockPlan]);
    });

    await act(async () => {
      await result.current.deleteFertilizationPlan(1);
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/Controllers/Soil/fertilizationPlan/1');
    expect(result.current.plans).toHaveLength(0);
  });

  test('handles API errors appropriately', async () => {
    const error = new Error('API Error');
    mockedAxios.get.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    try {
      await act(async () => {
        await result.current.fetchFertilizationPlans();
      });
    } catch (err) {
      expect(err).toBe(error);
    }

    expect(result.current.error).toBe('API Error');
    expect(result.current.loading).toBe(false);
  });

  test('loading state is managed correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [mockPlan] });

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    expect(result.current.loading).toBe(false);
    
    const promise = act(async () => {
      await result.current.fetchFertilizationPlans();
    });
    expect(result.current.loading).toBe(true);
    
    await promise;
    expect(result.current.loading).toBe(false);
  });
});
