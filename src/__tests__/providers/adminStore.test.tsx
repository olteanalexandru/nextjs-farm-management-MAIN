import { renderHook, act } from '@testing-library/react';
import { AdminProvider, useAdminStore } from '@/providers/AdminStore';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AdminStore Integration', () => {
  const mockUsers = [
    { id: '1', email: 'user1@test.com', roleType: 'FARMER' },
    { id: '2', email: 'user2@test.com', roleType: 'ADMIN' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches users successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: mockUsers } });

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('handles fetch users error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch users');
  });

  test('updates user role successfully', async () => {
    mockedAxios.put.mockResolvedValueOnce({ status: 200 });
    mockedAxios.get.mockResolvedValueOnce({ data: { users: mockUsers } });

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      await result.current.updateUserRole('user1@test.com', 'ADMIN');
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(
      '/api/Controllers/User/role',
      { email: 'user1@test.com', roleType: 'ADMIN' }
    );
    expect(result.current.error).toBeNull();
  });

  test('handles update role error', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('Failed to update'));

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      try {
        await result.current.updateUserRole('user1@test.com', 'ADMIN');
      } catch (error) {
        // Error should be thrown
      }
    });

    expect(result.current.error).toBe('Failed to update user role');
    expect(result.current.loading).toBe(false);
  });

  test('deletes user successfully', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 200 });

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    result.current.users = mockUsers;

    await act(async () => {
      await result.current.deleteUser('1');
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/Controllers/User/1');
    expect(result.current.users).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  test('handles delete user error', async () => {
    mockedAxios.delete.mockRejectedValueOnce(new Error('Failed to delete'));

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      try {
        await result.current.deleteUser('1');
      } catch (error) {
        // Error should be thrown
      }
    });

    expect(result.current.error).toBe('Failed to delete user');
    expect(result.current.loading).toBe(false);
  });

  test('handles unauthorized role update', async () => {
    mockedAxios.put.mockRejectedValueOnce({
      response: { status: 403, data: { error: 'Unauthorized' } }
    });

    const { result } = renderHook(() => useAdminStore(), {
      wrapper: AdminProvider
    });

    await act(async () => {
      try {
        await result.current.updateUserRole('user1@test.com', 'ADMIN');
      } catch (error) {
        // Error should be thrown
      }
    });

    expect(result.current.error).toBe('Failed to update user role');
  });
});
