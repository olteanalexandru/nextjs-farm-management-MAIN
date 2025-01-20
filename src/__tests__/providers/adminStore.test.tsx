import { renderHook, act } from '@testing-library/react';
import { AdminProvider, useAdminStore } from '@/app/providers/AdminStore';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AdminStore Integration', () => {
  const mockUsers = [
    { id: '1', email: 'user1@test.com', role: 'USER' },
    { id: '2', email: 'user2@test.com', role: 'ADMIN' }
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

  test('updates user role', async () => {
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
  });

  test('deletes user', async () => {
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
  });
});
