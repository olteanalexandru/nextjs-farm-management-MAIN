import { renderHook, act } from '@testing-library/react';
import { CropWikiProvider, useCropWiki } from '@/providers/CropWikiStore';
import { describe, test, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { createTestUser, createTestCrop, cleanupDatabase, prisma } from '../helpers/db-test-setup';

describe('CropWikiStore Integration', () => {
  let testUser;

  beforeAll(async () => {
    await cleanupDatabase();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase();
    testUser = await createTestUser();
  });

  test('fetches and filters crops', async () => {
    // Create test crops
    await createTestCrop(testUser.id, {
      cropName: 'Wheat',
      cropType: 'GRAIN',
      soilType: 'LOAMY'
    });
    await createTestCrop(testUser.id, {
      cropName: 'Corn',
      cropType: 'GRAIN',
      soilType: 'CLAY'
    });

    const { result } = renderHook(() => useCropWiki(), {
      wrapper: CropWikiProvider
    });

    // Initial fetch
    await act(async () => {
      await result.current.fetchCrops();
    });

    expect(result.current.crops).toHaveLength(2);
    expect(result.current.crops.map(c => c.cropName)).toContain('Wheat');
    expect(result.current.crops.map(c => c.cropName)).toContain('Corn');

    // Test search filter
    await act(async () => {
      result.current.updateFilters({
        search: 'Wheat',
        cropType: 'GRAIN',
        page: 1
      });
      await result.current.fetchCrops();
    });

    expect(result.current.crops).toHaveLength(1);
    expect(result.current.crops[0].cropName).toBe('Wheat');
  });

  test('handles pagination with real data', async () => {
    // Create 15 test crops (more than one page)
    for (let i = 1; i <= 15; i++) {
      await createTestCrop(testUser.id, {
        cropName: `Test Crop ${i}`,
        cropType: 'GRAIN',
        soilType: 'LOAMY'
      });
    }

    const { result } = renderHook(() => useCropWiki(), {
      wrapper: CropWikiProvider
    });

    // Test first page
    await act(async () => {
      result.current.updateFilters({ page: 1 });
      await result.current.fetchCrops();
    });

    expect(result.current.crops).toHaveLength(10); // Default page size
    expect(result.current.totalPages).toBe(2);

    // Test second page
    await act(async () => {
      result.current.updateFilters({ page: 2 });
      await result.current.fetchCrops();
    });

    expect(result.current.crops).toHaveLength(5);
  });

  test('handles sorting', async () => {
    // Create test crops with different names
    await createTestCrop(testUser.id, { cropName: 'Zucchini' });
    await createTestCrop(testUser.id, { cropName: 'Apple' });
    await createTestCrop(testUser.id, { cropName: 'Banana' });

    const { result } = renderHook(() => useCropWiki(), {
      wrapper: CropWikiProvider
    });

    // Test ascending sort
    await act(async () => {
      result.current.updateFilters({
        sortBy: 'cropName',
        sortOrder: 'asc'
      });
      await result.current.fetchCrops();
    });

    expect(result.current.crops[0].cropName).toBe('Apple');

    // Test descending sort
    await act(async () => {
      result.current.updateFilters({
        sortBy: 'cropName',
        sortOrder: 'desc'
      });
      await result.current.fetchCrops();
    });

    expect(result.current.crops[0].cropName).toBe('Zucchini');
  });

  test('handles database errors gracefully', async () => {
    // Disconnect database to simulate error
    await prisma.$disconnect();

    const { result } = renderHook(() => useCropWiki(), {
      wrapper: CropWikiProvider
    });

    await act(async () => {
      await result.current.fetchCrops();
    });

    expect(result.current.error).toBe('Failed to load crops. Please try again later.');
    expect(result.current.loading).toBe(false);

    // Reconnect for other tests
    await prisma.$connect();
  });
});
