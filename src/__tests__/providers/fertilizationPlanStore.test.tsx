import { describe, test, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { configure } from 'mobx';
import { renderHook, act } from '@testing-library/react';
import { FertilizationPlanProvider, useFertilizationPlans } from '@/providers/fertilizationPlanStore';
import { createTestUser, createTestCrop, createTestFertilizationPlan, cleanupDatabase, prisma } from '../helpers/db-test-setup';
import { Decimal } from '@prisma/client/runtime/library';

configure({ enforceActions: 'always' });

describe('FertilizationPlanStore', () => {
  let testUser;
  let testCrop;

  beforeAll(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase();
    testUser = await createTestUser();
    testCrop = await createTestCrop(testUser.id);
  });

  test('fetchFertilizationPlans retrieves plans', async () => {
    // Create test fertilization plan
    const plan = await createTestFertilizationPlan(testUser.id, testCrop.id, {
      plannedDate: new Date('2023-01-01'),
      fertilizer: 'Test Fertilizer',
      applicationMethod: 'broadcast'
    });

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    await act(async () => {
      await result.current.fetchFertilizationPlans();
    });

    expect(result.current.plans).toHaveLength(1);
    expect(result.current.plans[0].fertilizer).toBe('Test Fertilizer');
    expect(result.current.error).toBeNull();
  });

  test('saveFertilizationPlan handles creation', async () => {
    const formData = {
      cropId: testCrop.id.toString(),
      plannedDate: '2023-01-01',
      fertilizer: 'New Fertilizer',
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

    // Verify plan was created in database
    const plans = await prisma.fertilizationPlan.findMany({
      where: { userId: testUser.id }
    });

    expect(plans).toHaveLength(1);
    expect(plans[0].fertilizer).toBe('New Fertilizer');
    expect(plans[0].cropId).toBe(testCrop.id);
    expect(result.current.error).toBeNull();
  });

  test('updateFertilizationPlan handles updates', async () => {
    // Create initial plan
    const plan = await createTestFertilizationPlan(testUser.id, testCrop.id);

    const updateData = {
      fertilizer: 'Updated Fertilizer',
      applicationRate: 150
    };

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    await act(async () => {
      await result.current.updateFertilizationPlan(plan.id, updateData);
    });

    // Verify update in database
    const updatedPlan = await prisma.fertilizationPlan.findUnique({
      where: { id: plan.id }
    });

    expect(updatedPlan?.fertilizer).toBe('Updated Fertilizer');
    expect(updatedPlan?.applicationRate instanceof Decimal).toBe(true);
    expect(updatedPlan?.applicationRate.toNumber()).toBe(150);
  });

  test('deleteFertilizationPlan removes plan', async () => {
    // Create plan to delete
    const plan = await createTestFertilizationPlan(testUser.id, testCrop.id);

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    // Fetch initial plans
    await act(async () => {
      await result.current.fetchFertilizationPlans();
    });
    expect(result.current.plans).toHaveLength(1);

    // Delete plan
    await act(async () => {
      await result.current.deleteFertilizationPlan(plan.id);
    });

    // Verify deletion in database
    const deletedPlan = await prisma.fertilizationPlan.findUnique({
      where: { id: plan.id }
    });
    expect(deletedPlan).toBeNull();
    expect(result.current.plans).toHaveLength(0);
  });

  test('handles database errors appropriately', async () => {
    // Disconnect database to simulate error
    await prisma.$disconnect();

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    await act(async () => {
      try {
        await result.current.fetchFertilizationPlans();
      } catch (err) {
        // Error should be thrown
      }
    });

    expect(result.current.error).toBe('An error occurred');
    expect(result.current.loading).toBe(false);

    // Reconnect for other tests
    await prisma.$connect();
  });

  test('loading state is managed correctly', async () => {
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

  test('handles relationships correctly', async () => {
    // Create multiple crops and plans
    const secondCrop = await createTestCrop(testUser.id, { cropName: 'Second Crop' });
    
    await createTestFertilizationPlan(testUser.id, testCrop.id);
    await createTestFertilizationPlan(testUser.id, secondCrop.id);

    const { result } = renderHook(() => useFertilizationPlans(), {
      wrapper: FertilizationPlanProvider
    });

    // Fetch crops and plans
    await act(async () => {
      await result.current.fetchCrops();
      await result.current.fetchFertilizationPlans();
    });

    expect(result.current.crops).toHaveLength(2);
    expect(result.current.plans).toHaveLength(2);
    expect(result.current.plans[0].crop).toBeDefined();
    expect(result.current.plans[1].crop).toBeDefined();
  });
});
