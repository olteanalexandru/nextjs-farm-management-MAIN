import { render, act, renderHook, waitFor } from '@testing-library/react';
import { SoilManagementProvider, useSoilManagement } from '../soilManagementStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test data
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

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SoilManagementProvider>{children}</SoilManagementProvider>
);

describe('SoilManagementStore', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Soil Tests', () => {
    it('should fetch soil tests successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockSoilTest],
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      await act(async () => {
        await result.current.fetchSoilTests();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/Controllers/Soil/soilTests');
      expect(result.current.soilTests).toEqual([mockSoilTest]);
      expect(result.current.error).toBeNull();
    });

    it('should handle soil test fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      await act(async () => {
        try {
          await result.current.fetchSoilTests();
        } catch (error) {
          // Error expected
        }
      });

      expect(result.current.error).toBe('Failed to fetch soil tests');
      expect(result.current.soilTests).toEqual([]);
    });

    it('should add soil test successfully', async () => {
      const newTest = { ...mockSoilTest };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newTest,
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      await act(async () => {
        await result.current.addSoilTest(newTest);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/Controllers/Soil/soilTest',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTest),
        })
      );
      expect(result.current.soilTests).toContainEqual(newTest);
    });

    it('should update soil test successfully', async () => {
      const updatedTest = { ...mockSoilTest, pH: 7.0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedTest,
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      await act(async () => {
        await result.current.updateSoilTest(1, { pH: 7.0 });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/Controllers/Soil/soilTest/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ pH: 7.0 }),
        })
      );
    });

    it('should delete soil test successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      // Add a test first
      result.current.soilTests = [mockSoilTest];

      await act(async () => {
        await result.current.deleteSoilTest(1);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/Controllers/Soil/soilTest/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.current.soilTests).toEqual([]);
    });
  });

  describe('Fertilization Plans', () => {
    it('should fetch fertilization plans successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockFertilizationPlan],
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      await act(async () => {
        await result.current.fetchFertilizationPlans();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/Controllers/Soil/fertilizationPlans');
      expect(result.current.fertilizationPlans).toEqual([mockFertilizationPlan]);
      expect(result.current.error).toBeNull();
    });

    it('should add fertilization plan successfully', async () => {
      const newPlan = { ...mockFertilizationPlan };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newPlan,
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      await act(async () => {
        await result.current.addFertilizationPlan(newPlan);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/Controllers/Soil/fertilizationPlan',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newPlan),
        })
      );
      expect(result.current.fertilizationPlans).toContainEqual(newPlan);
    });

    it('should update fertilization plan successfully', async () => {
      const updatedPlan = { ...mockFertilizationPlan, applicationRate: 150 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedPlan,
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      await act(async () => {
        await result.current.updateFertilizationPlan(1, { applicationRate: 150 });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/Controllers/Soil/fertilizationPlan/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ applicationRate: 150 }),
        })
      );
    });

    it('should delete fertilization plan successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      // Add a plan first
      result.current.fertilizationPlans = [mockFertilizationPlan];

      await act(async () => {
        await result.current.deleteFertilizationPlan(1);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/Controllers/Soil/fertilizationPlan/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.current.fertilizationPlans).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should clear error when requested', async () => {
      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      // Set an error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

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
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

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
      mockFetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
          .then(() => ({
            ok: true,
            json: async () => [mockSoilTest],
          }))
      );

      const { result } = renderHook(() => useSoilManagement(), { wrapper });

      expect(result.current.loading).toBe(false);

      const fetchPromise = act(async () => {
        await result.current.fetchSoilTests();
      });

      expect(result.current.loading).toBe(true);

      await fetchPromise;

      expect(result.current.loading).toBe(false);
    });
  });
});
