import { renderHook, act } from '@testing-library/react';
import { AdminProvider, useAdminStore } from '@/providers/AdminStore';
import { describe, test, expect, beforeEach, beforeAll, afterAll, afterEach } from 'vitest';
import { createTestUser, cleanupDatabase, prisma } from '../helpers/db-test-setup';

describe('AdminStore Integration', () => {
  beforeAll(async () => {
    // Initialize test database
    await cleanupDatabase();
  });

  afterAll(async () => {
    // Cleanup after all tests
    await cleanupDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanupDatabase();
  });

  test('fetches users successfully', async () => {
    // Create test users in the database
    const user1 = await createTestUser({ email: 'user1@test.com', roleType: 'FARMER' });
    const user2 = await createTestUser({ email: 'user2@test.com', roleType: 'ADMIN' });

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users.map(u => u.email)).toContain(user1.email);
    expect(result.current.users.map(u => u.email)).toContain(user2.email);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('handles fetch users error when database is down', async () => {
    // Temporarily disconnect prisma to simulate database error
    await prisma.$disconnect();

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch users');

    // Reconnect prisma for other tests
    await prisma.$connect();
  });

  test('updates user role successfully', async () => {
    // Create a test user
    const user = await createTestUser({ email: 'user1@test.com', roleType: 'FARMER' });

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      await result.current.updateUserRole(user.email, 'ADMIN');
    });

    // Verify the role was updated in the database
    const updatedUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    expect(updatedUser?.roleType).toBe('ADMIN');
    expect(result.current.error).toBeNull();
  });

  test('handles update role error for non-existent user', async () => {
    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      try {
        await result.current.updateUserRole('nonexistent@test.com', 'ADMIN');
      } catch (error) {
        // Error should be thrown
      }
    });

    expect(result.current.error).toBe('Failed to update user role');
    expect(result.current.loading).toBe(false);
  });

  test('deletes user successfully', async () => {
    // Create test users
    const user1 = await createTestUser({ email: 'user1@test.com' });
    const user2 = await createTestUser({ email: 'user2@test.com' });

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    // Fetch initial users
    await act(async () => {
      await result.current.fetchUsers();
    });

    // Delete user
    await act(async () => {
      await result.current.deleteUser(user1.id);
    });

    // Verify user was deleted from database
    const deletedUser = await prisma.user.findUnique({
      where: { id: user1.id }
    });

    expect(deletedUser).toBeNull();
    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].id).toBe(user2.id);
    expect(result.current.error).toBeNull();
  });

  test('handles delete user error for non-existent user', async () => {
    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      try {
        await result.current.deleteUser('non-existent-id');
      } catch (error) {
        // Error should be thrown
      }
    });

    expect(result.current.error).toBe('Failed to delete user');
    expect(result.current.loading).toBe(false);
  });
});
