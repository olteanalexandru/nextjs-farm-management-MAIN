import { renderHook, act } from '@testing-library/react';
import { CropWikiProvider, useCropWiki } from '@/app/providers/CropWikiStore';
import axios from 'axios';

jest.mock('axios');

describe('CropWikiStore Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and filters crops', async () => {
    const mockCrops = [
      { id: 1, cropName: 'Wheat', cropType: 'GRAIN', soilType: 'LOAMY' },
      { id: 2, cropName: 'Corn', cropType: 'GRAIN', soilType: 'CLAY' }
    ];

    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        crops: mockCrops,
        pagination: { totalPages: 1 }
      }
    });

    const { result } = renderHook(() => useCropWiki(), {
      wrapper: CropWikiProvider
    });

    await act(async () => {
      await result.current.fetchCrops();
    });

    expect(result.current.crops).toEqual(mockCrops);
    expect(result.current.totalPages).toBe(1);

    // Test filter updates
    await act(async () => {
      result.current.updateFilters({
        search: 'wheat',
        cropType: 'GRAIN',
        page: 1
      });
    });

    expect(result.current.filters.search).toBe('wheat');
    expect(result.current.filters.cropType).toBe('GRAIN');
  });

  test('handles pagination and sorting', async () => {
    const { result } = renderHook(() => useCropWiki(), {
      wrapper: CropWikiProvider
    });

    await act(async () => {
      result.current.updateFilters({
        page: 2,
        sortBy: 'cropName',
        sortOrder: 'desc'
      });
    });

    expect(result.current.filters.page).toBe(2);
    expect(result.current.filters.sortBy).toBe('cropName');
    expect(result.current.filters.sortOrder).toBe('desc');
  });
});
