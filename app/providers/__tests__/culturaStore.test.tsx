import { render, act, renderHook, waitFor } from '@testing-library/react';
import { GlobalContextProvider, useGlobalContextCrop } from '../culturaStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { CropCreate, RecommendationResponse } from '../../types/api';

// Mock Auth0 hook
vi.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: vi.fn(),
}));

// Mock axios
vi.mock('axios');
const mockAxios = vi.mocked(axios, true);

// Test data
const mockCrop = {
  id: 1,
  _id: '1',
  userId: 'user123',
  auth0Id: 'auth0|123',
  cropName: 'Test Crop',
  cropType: 'Cereal',
  cropVariety: 'Test Variety',
  plantingDate: '2024-01-01T00:00:00.000Z',
  harvestingDate: '2024-06-01T00:00:00.000Z',
  description: 'Test description',
  imageUrl: 'test.jpg',
  soilType: 'Loamy',
  climate: 'Temperate',
  nitrogenSupply: 50,
  nitrogenDemand: 100,
  isSelected: false,
  pests: ['Pest 1', 'Pest 2'],
  diseases: ['Disease 1', 'Disease 2'],
};

const mockCropCreate: CropCreate = {
  cropName: 'Test Crop',
  cropType: 'Cereal',
  cropVariety: 'Test Variety',
  plantingDate: '2024-01-01T00:00:00.000Z',
  harvestingDate: '2024-06-01T00:00:00.000Z',
  description: 'Test description',
  imageUrl: 'test.jpg',
  soilType: 'Loamy',
  climate: 'Temperate',
  nitrogenSupply: 50,
  nitrogenDemand: 100,
  soilResidualNitrogen: 20,
  ItShouldNotBeRepeatedForXYears: 2,
  fertilizers: [],
  pests: ['Pest 1', 'Pest 2'],
  diseases: ['Disease 1', 'Disease 2'],
};

// Mock Auth0 user
const mockAuth0User = {
  sub: 'auth0|123',
  name: 'Test User',
  email: 'test@example.com',
};

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GlobalContextProvider>{children}</GlobalContextProvider>
);

describe('CulturaStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Auth0 useUser hook to return a user by default
    const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
    useAuth0User.mockReturnValue({
      user: mockAuth0User,
      isLoading: false,
      error: null,
    });
  });

  describe('Crop Management', () => {
    it('should create crop successfully', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 201,
        data: { crop: mockCrop },
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.createCrop(mockCropCreate);
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/Controllers/Crop/crop/single',
        expect.objectContaining({
          ...mockCropCreate,
          soilResidualNitrogen: 20,
        })
      );
      expect(result.current.isSuccess.value).toBe(true);
      expect(result.current.message.value).toBe('Crop created successfully');
    });

    it('should get all crops successfully', async () => {
      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          crops: [mockCrop],
          selections: [],
        },
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.getAllCrops();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/Controllers/Crop/crops/retrieve/all');
      expect(result.current.crops).toHaveLength(1);
      expect(result.current.areThereCrops.value).toBe(true);
    });

    it('should update crop successfully', async () => {
      mockAxios.put.mockResolvedValueOnce({
        status: 200,
        data: {
          data: {
            ...mockCrop,
            cropName: 'Updated Crop',
            user: { auth0Id: mockAuth0User.sub },
          },
        },
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.updateCrop('1', {
          ...mockCropCreate,
          cropName: 'Updated Crop',
        });
      });

      expect(mockAxios.put).toHaveBeenCalledWith(
        `/api/Controllers/Crop/crop/1/${mockAuth0User.sub}`,
        expect.objectContaining({
          cropName: 'Updated Crop',
        })
      );
      expect(result.current.isSuccess.value).toBe(true);
      expect(result.current.message.value).toBe('Crop updated successfully');
    });

    it('should delete crop successfully', async () => {
      mockAxios.delete.mockResolvedValueOnce({
        status: 200,
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.deleteCrop('1');
      });

      expect(mockAxios.delete).toHaveBeenCalledWith(
        `/api/Controllers/Crop/crops/${mockAuth0User.sub}/1`
      );
      expect(result.current.isSuccess.value).toBe(true);
      expect(result.current.message.value).toBe('Crop deleted successfully');
    });
  });

  describe('Crop Selection', () => {
    it('should update crop selection successfully', async () => {
      mockAxios.put.mockResolvedValueOnce({
        status: 200,
      });

      // Mock getAllCrops call that happens after selection
      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          crops: [{ ...mockCrop, isSelected: true }],
          selections: [{ cropId: 1, selectionCount: 1 }],
        },
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.selectare('1', true);
      });

      expect(mockAxios.put).toHaveBeenCalledWith(
        '/api/Controllers/Crop/crops/1/selectare',
        { selectare: true }
      );
      expect(result.current.isSuccess.value).toBe(true);
      expect(result.current.message.value).toBe('Crop selection updated successfully');
    });

    it('should update selection count successfully', async () => {
      mockAxios.put.mockResolvedValueOnce({
        status: 200,
      });

      // Mock getAllCrops call that happens after update
      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          crops: [mockCrop],
          selections: [{ cropId: 1, selectionCount: 2 }],
        },
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.updateSelectionCount('1', 2);
      });

      expect(mockAxios.put).toHaveBeenCalledWith(
        '/api/Controllers/Crop/crops/1/selectare',
        { selectare: true, numSelections: 2 }
      );
    });
  });

  describe('Crop Recommendations', () => {
    it('should get crop recommendations successfully', async () => {
      const mockRecommendation = {
        id: 2,
        _id: '2',
        cropName: 'Recommended Crop',
        cropType: 'RECOMMENDATION',
        nitrogenSupply: 40,
        nitrogenDemand: 80,
        pests: ['Pest 1'],
        diseases: ['Disease 1'],
      };

      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          crops: [mockRecommendation],
        },
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      const recommendations = await result.current.getCropRecommendations('Test Crop');

      expect(mockAxios.get).toHaveBeenCalledWith(
        '/api/Controllers/Crop/crops/recommendations/Test Crop'
      );
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].cropType).toBe('RECOMMENDATION');
    });

    it('should add crop recommendation successfully', async () => {
      const mockRecommendation: RecommendationResponse = {
        id: 2,
        _id: '2',
        cropName: 'New Recommendation',
        cropType: 'RECOMMENDATION',
        nitrogenSupply: 40,
        nitrogenDemand: 80,
        pests: ['Pest 1'],
        diseases: ['Disease 1'],
      };

      mockAxios.post.mockResolvedValueOnce({
        status: 201,
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.addTheCropRecommendation(mockRecommendation);
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/Controllers/Crop/crops/recommendations',
        expect.objectContaining({
          cropName: 'New Recommendation',
          cropType: 'RECOMMENDATION',
        }),
        expect.any(Object)
      );
      expect(result.current.isSuccess.value).toBe(true);
      expect(result.current.message.value).toBe('Recommendation added successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle crop creation error', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Failed to create crop'));

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.createCrop(mockCropCreate);
      });

      expect(result.current.isError.value).toBe(true);
      expect(result.current.message.value).toBe('Error creating crop');
    });

    it('should handle unauthorized user', async () => {
      // Mock Auth0 useUser hook to return no user
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useGlobalContextCrop(), { wrapper });

      await act(async () => {
        await result.current.deleteCrop('1');
      });

      expect(result.current.isError.value).toBe(true);
      expect(result.current.message.value).toBe('Error deleting crop');
    });
  });
});
