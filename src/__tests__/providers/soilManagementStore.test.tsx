import { renderHook, act, waitFor } from '@testing-library/react';
import { SoilManagementProvider, useSoilManagement } from '@/providers/soilManagementStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SoilManagementStore', () => {
  const mockSoilTest = {
    id: 1,
    testDate: '2024-01-01',
    fieldLocation: 'Test Field',
    pH: 6.5,
    organicMatter: 2.5,
    nitrogen: 20,
    phosphorus: 15,
    potassium: 25,
    texture: 'Loamy',
  };

  const mockFertilizationPlan = {
    id: 1,
    cropId: 1,
    plannedDate: '2024-02-01',
    fertilizer: 'Test Fertilizer',
    applicationRate: 100,
    nitrogenContent: 46,
    applicationMethod: 'Broadcast',
    completed: false,
    crop: {
      id: 1,
      cropName: 'Test Crop',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Soil Tests', () => {
    it('should fetch soil tests successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [mockSoilTest] });

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      await act(async () => {
        await result.current.fetchSoilTests();
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/Controllers/Soil/soilTests');
      expect(result.current.soilTests).toEqual([mockSoilTest]);
      expect(result.current.error).toBeNull();
    });

    it('should handle soil test fetch error', async () => {
      const error = new Error('Failed to fetch soil tests');
      mockedAxios.get.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      // Set initial state
      result.current.setSoilTests([]);

      await act(async () => {
        try {
          await result.current.fetchSoilTests();
        } catch (error) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch soil tests');
        expect(result.current.soilTests).toHaveLength(0);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should add soil test successfully', async () => {
      const newTest = { ...mockSoilTest };
      mockedAxios.post.mockResolvedValueOnce({ data: newTest });

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      await act(async () => {
        await result.current.addSoilTest(newTest);
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/Controllers/Soil/soilTest',
        newTest
      );
      expect(result.current.soilTests).toContainEqual(newTest);
    });

    it('should update soil test successfully', async () => {
      const updatedTest = { ...mockSoilTest, pH: 7.0 };
      mockedAxios.put.mockResolvedValueOnce({ data: updatedTest });

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      await act(async () => {
        await result.current.updateSoilTest(1, { pH: 7.0 });
      });

      expect(mockedAxios.put).toHaveBeenCalledWith(
        '/api/Controllers/Soil/soilTest/1',
        { pH: 7.0 }
      );
    });

    it('should delete soil test successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({});

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      // Add a test first
      result.current.soilTests = [mockSoilTest];

      await act(async () => {
        await result.current.deleteSoilTest(1);
      });

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        '/api/Controllers/Soil/soilTest/1'
      );
      expect(result.current.soilTests).toEqual([]);
    });
  });

  describe('Fertilization Plans', () => {
    it('should fetch fertilization plans successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [mockFertilizationPlan] });

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      await act(async () => {
        await result.current.fetchFertilizationPlans();
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/Controllers/Soil/fertilizationPlans');
      expect(result.current.fertilizationPlans).toEqual([mockFertilizationPlan]);
    });

    it('should add fertilization plan successfully', async () => {
      const newPlan = { ...mockFertilizationPlan };
      mockedAxios.post.mockResolvedValueOnce({ data: newPlan });

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      await act(async () => {
        await result.current.addFertilizationPlan(newPlan);
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/Controllers/Soil/fertilizationPlan',
        newPlan
      );
      expect(result.current.fertilizationPlans).toContainEqual(newPlan);
    });

    it('should update fertilization plan successfully', async () => {
      const updatedPlan = { ...mockFertilizationPlan, applicationRate: 150 };
      mockedAxios.put.mockResolvedValueOnce({ data: updatedPlan });

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      await act(async () => {
        await result.current.updateFertilizationPlan(1, { applicationRate: 150 });
      });

      expect(mockedAxios.put).toHaveBeenCalledWith(
        '/api/Controllers/Soil/fertilizationPlan/1',
        { applicationRate: 150 }
      );
    });

    it('should delete fertilization plan successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({});

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      // Add a plan first
      result.current.fertilizationPlans = [mockFertilizationPlan];

      await act(async () => {
        await result.current.deleteFertilizationPlan(1);
      });

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        '/api/Controllers/Soil/fertilizationPlan/1'
      );
      expect(result.current.fertilizationPlans).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should clear error when requested', async () => {
      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      // Set an error
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch soil tests'));

      await act(async () => {
        try {
          await result.current.fetchSoilTests();
        } catch (error) {
          // Error expected
        }
      });

      expect(result.current.error).toBeTruthy();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      await act(async () => {
        try {
          await result.current.fetchSoilTests();
        } catch (error) {
          // Error expected
        }
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Loading State', () => {
    it('should manage loading state during API calls', async () => {
      const { result } = renderHook(() => useSoilManagement(), {
        wrapper: SoilManagementProvider
      });

      mockedAxios.get.mockImplementationOnce(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: [mockSoilTest]
            });
          }, 100);
        })
      );

      expect(result.current.loading).toBe(false);

      let fetchPromise;
      await act(async () => {
        fetchPromise = result.current.fetchSoilTests();
      });
      
      // Check loading state immediately after starting fetch
      expect(result.current.loading).toBe(true);

      // Wait for fetch to complete
      await act(async () => {
        await fetchPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });
});

describe('SoilManagementStore Placeholder', () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
});
