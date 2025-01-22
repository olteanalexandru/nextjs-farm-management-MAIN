import { renderHook, act } from '@testing-library/react';
import { GlobalContextProvider, useGlobalContextCrop } from '@/providers/culturaStore';
import axios, { AxiosInstance } from 'axios';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Mock Auth0
vi.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'test-user-id' } })
}));

describe('CulturaStore Integration', () => {
  const mockCrop = {
    id: 1,
    _id: '1',
    userId: 'user123',
    auth0Id: 'auth0|123',
    cropName: 'Test Crop',
    cropType: 'GRAIN',
    cropVariety: 'Test Variety',
    plantingDate: '2024-01-01T00:00:00.000Z',
    harvestingDate: '2024-06-01T00:00:00.000Z',
    description: 'Test description',
    imageUrl: 'test.jpg',
    soilType: 'Loamy',
    climate: 'Temperate',
    nitrogenSupply: 50,
    nitrogenDemand: 30,
    isSelected: false,
    pests: ['pest1'],
    diseases: ['disease1']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('manages complete crop lifecycle', async () => {
    // Mock create crop
    mockedAxios.post.mockResolvedValueOnce({ 
      status: 201, 
      data: { crop: mockCrop } 
    });
    
    // Mock get crops
    mockedAxios.get.mockResolvedValueOnce({ 
      status: 200,
      data: { 
        crops: [mockCrop], 
        selections: [] 
      }
    });

    const { result } = renderHook(() => useGlobalContextCrop(), {
      wrapper: GlobalContextProvider
    });

    // Test crop creation
    await act(async () => {
      await result.current.createCrop({
        cropName: 'Test Crop',
        cropType: 'GRAIN',
        nitrogenSupply: 50,
        nitrogenDemand: 30,
        soilResidualNitrogen: 20,
        cropVariety: 'Test Variety',
        soilType: 'Loamy',
        ItShouldNotBeRepeatedForXYears: 2,
        details: [
          { detailType: 'PEST', value: 'pest1' },
          { detailType: 'DISEASE', value: 'disease1' }
        ],
        climate: 'Temperate',
        description: 'Test description'
      });
    });

    expect(result.current.isSuccess.value).toBe(true);

    // Test crop recommendations
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { 
        crops: [{
          id: 2,
          cropName: 'Test Crop',
          cropType: 'RECOMMENDATION',
          nitrogenSupply: 50,
          nitrogenDemand: 30,
          details: [
            { detailType: 'PEST', value: 'pest1' },
            { detailType: 'DISEASE', value: 'disease1' }
          ]
        }]
      }
    });

    await act(async () => {
      const recommendations = await result.current.getCropRecommendations('Test Crop');
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].cropName).toBe('Test Crop');
    });
  });

  test('handles crop selection updates', async () => {
    mockedAxios.put.mockResolvedValueOnce({ status: 200 });
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { 
        crops: [{ ...mockCrop, isSelected: true }],
        selections: [{ cropId: 1, selectionCount: 2 }]
      }
    });

    const { result } = renderHook(() => useGlobalContextCrop(), {
      wrapper: GlobalContextProvider
    });

    await act(async () => {
      await result.current.updateSelectionCount('1', 2);
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/selectare'),
      expect.objectContaining({
        selectare: true,
        numSelections: 2
      })
    );
  });
});
