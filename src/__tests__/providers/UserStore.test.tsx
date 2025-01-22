import { render, act, renderHook, waitFor } from '@testing-library/react';
import { UserProvider, useUserContext } from '@/providers/UserStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

interface Auth0User {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

interface Auth0State {
  user: Auth0User | null;
  isLoading: boolean;
  error: Error | null;
}

// Mock Auth0 hook
let mockAuth0User: Auth0State = {
  user: null,
  isLoading: false,
  error: null,
};

vi.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => mockAuth0User,
}));

// Mock axios
vi.mock('axios');
const mockAxios = vi.mocked(axios, true);

// Test data
const mockUserData = {
  id: 'user123',
  auth0Id: 'auth0|123',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/picture.jpg',
  roleType: 'FARMER',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// Mock Auth0 user data
const mockAuth0UserData: Auth0User = {
  sub: 'auth0|123',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/picture.jpg',
};

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>{children}</UserProvider>
);

describe('UserStore', () => {
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Auth0 mock to default state
    mockAuth0User = {
      user: null,
      isLoading: false,
      error: null,
    };
    // Save original window
    originalWindow = window;
    // Mock window.location
    const location = {
      href: '',
    };
    Object.defineProperty(window, 'location', {
      value: location,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original window
    window = originalWindow;
  });

  describe('User Authentication', () => {
    it('should initialize user data when Auth0 user is present', async () => {
      // Set up Auth0 mock
      mockAuth0User = {
        user: mockAuth0UserData,
        isLoading: false,
        error: null,
      };

      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { user: mockUserData },
      });

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockUserData);
        expect(result.current.isUserLoggedIn).toBe(true);
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/Controllers/User/create');
    });

    it('should handle user initialization error', async () => {
      // Set up Auth0 mock
      mockAuth0User = {
        user: mockAuth0UserData,
        isLoading: false,
        error: null,
      };

      mockAxios.post.mockRejectedValueOnce(new Error('Failed to create user'));

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isUserLoggedIn).toBe(false);
        expect(result.current.data).toEqual({
          id: '',
          auth0Id: '',
          name: '',
          email: '',
          roleType: '',
          createdAt: '',
          updatedAt: '',
          picture: null,
        });
      });
    });

    it('should handle no Auth0 user present', async () => {
      // Set up Auth0 mock with no user
      mockAuth0User = {
        user: null,
        isLoading: false,
        error: null,
      };

      const { result } = renderHook(() => useUserContext(), { wrapper });

      expect(result.current.isUserLoggedIn).toBe(false);
      expect(mockAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Role Management', () => {
    beforeEach(() => {
      // Set up authenticated user for each test
      mockAuth0User = {
        user: mockAuth0UserData,
        isLoading: false,
        error: null,
      };
    });

    it('should update user role successfully', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { user: mockUserData },
      });

      mockAxios.put.mockResolvedValueOnce({
        status: 200,
        data: { ...mockUserData, roleType: 'ADMIN' },
      });

      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { users: [] },
      });

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isUserLoggedIn).toBe(true);
      });

      await act(async () => {
        await result.current.updateRole('test@example.com', 'ADMIN');
      });

      expect(mockAxios.put).toHaveBeenCalledWith(
        '/api/Controllers/User/role',
        { email: 'test@example.com', roleType: 'ADMIN' }
      );
    });

    it('should handle role update error', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { user: mockUserData },
      });

      mockAxios.put.mockRejectedValueOnce(new Error('Failed to update role'));

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isUserLoggedIn).toBe(true);
      });

      await expect(
        result.current.updateRole('test@example.com', 'ADMIN')
      ).rejects.toThrow('Failed to update role');
    });
  });

  describe('Farmer Users Management', () => {
    beforeEach(() => {
      // Set up authenticated admin user for each test
      mockAuth0User = {
        user: mockAuth0UserData,
        isLoading: false,
        error: null,
      };
    });

    it('should fetch farmer users when user is admin', async () => {
      const mockFarmers = [
        { ...mockUserData, id: 'farmer1' },
        { ...mockUserData, id: 'farmer2' },
      ];

      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { user: { ...mockUserData, roleType: 'ADMIN' } },
      });

      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { users: mockFarmers },
      });

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.fermierUsers).toEqual(mockFarmers);
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/Controllers/User/all');
    });

    it('should delete farmer user successfully', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { user: mockUserData },
      });

      mockAxios.delete.mockResolvedValueOnce({
        status: 200,
      });

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await act(async () => {
        await result.current.deleteUser('farmer1');
      });

      expect(mockAxios.delete).toHaveBeenCalledWith('/api/Controllers/User/farmer1');
    });
  });

  describe('Loading State', () => {
    it('should handle loading state during initialization', async () => {
      // Start with loading state
      mockAuth0User = {
        user: null,
        isLoading: true,
        error: null,
      };

      const { result } = renderHook(() => useUserContext(), { wrapper });

      // Initial state should be loading
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        // Update mock to finish loading with a user
        mockAuth0User = {
          user: mockAuth0UserData,
          isLoading: false,
          error: null,
        };
      });

      // Mock successful user creation
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { user: mockUserData },
      });

      // Wait for all state updates to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Authentication Actions', () => {
    beforeEach(() => {
      // Set up basic user state
      mockAuth0User = {
        user: mockAuth0UserData,
        isLoading: false,
        error: null,
      };
    });

    it('should provide login function', async () => {
      const { result } = renderHook(() => useUserContext(), { wrapper });

      await act(async () => {
        result.current.login();
      });

      expect(window.location.href).toBe('/api/auth/login');
    });

    it('should provide logout function', async () => {
      const { result } = renderHook(() => useUserContext(), { wrapper });

      await act(async () => {
        result.current.logout();
      });

      expect(window.location.href).toBe('/api/auth/logout');
    });
  });
});
