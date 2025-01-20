import { renderHook, act } from '@testing-library/react';
import { GlobalContextProvider, useGlobalContextCrop } from '@/app/providers/culturaStore';
import axios from 'axios';

jest.mock('axios');
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'test-user-id' } })
}));

describe('CulturaStore Integration', () => {
  const mockCrop = {
    id: 1,
    cropName: 'Test Crop',
    cropType: 'GRAIN',
    nitrogenSupply: 50,
    nitrogenDemand: 30,
    pests: ['pest1'],
    diseases: ['disease1']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('manages complete crop lifecycle', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    
    // Mock create crop
    mockedAxios.post.mockResolvedValueOnce({ status: 201, data: mockCrop });
    
    // Mock get crops
    mockedAxios.get.mockResolvedValueOnce({ 
      data: { crops: [mockCrop], selections: [] }
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
        soilResidualNitrogen: 20
      });
    });

    expect(result.current.isSuccess.value).toBeTruthy();

    // Test crop recommendations
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { crops: [mockCrop] }
    });

    await act(async () => {
      const recommendations = await result.current.getCropRecommendations('Test Crop');
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].cropName).toBe('Test Crop');
    });
  });

  test('handles crop selection updates', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.put.mockResolvedValueOnce({ status: 200 });
    mockedAxios.get.mockResolvedValueOnce({
      data: { crops: [mockCrop], selections: [] }
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
