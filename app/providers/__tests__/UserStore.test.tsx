import { render, act, renderHook, waitFor } from '@testing-library/react';
import { UserProvider, useUserContext } from '../UserStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock Auth0 hook
vi.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: vi.fn(),
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

// Mock Auth0 user
const mockAuth0User = {
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Authentication', () => {
    it('should initialize user data when Auth0 user is present', async () => {
      // Mock Auth0 useUser hook to return a user
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: mockAuth0User,
        isLoading: false,
        error: null,
      });

      // Mock API response for user creation
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
      // Mock Auth0 useUser hook to return a user
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: mockAuth0User,
        isLoading: false,
        error: null,
      });

      // Mock API error response
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
      // Mock Auth0 useUser hook to return no user
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUserContext(), { wrapper });

      expect(result.current.isUserLoggedIn).toBe(false);
      expect(mockAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Role Management', () => {
    it('should update user role successfully', async () => {
      // Mock Auth0 useUser hook
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: mockAuth0User,
        isLoading: false,
        error: null,
      });

      // Mock API responses
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { user: mockUserData },
      });

      mockAxios.put.mockResolvedValueOnce({
        status: 200,
        data: { ...mockUserData, roleType: 'ADMIN' },
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
      // Mock Auth0 useUser hook
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: mockAuth0User,
        isLoading: false,
        error: null,
      });

      // Mock API responses
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
        act(async () => {
          await result.current.updateRole('test@example.com', 'ADMIN');
        })
      ).rejects.toThrow('Failed to update role');
    });
  });

  describe('Farmer Users Management', () => {
    it('should fetch farmer users when user is admin', async () => {
      const mockFarmers = [
        { ...mockUserData, id: 'farmer1' },
        { ...mockUserData, id: 'farmer2' },
      ];

      // Mock Auth0 useUser hook
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: mockAuth0User,
        isLoading: false,
        error: null,
      });

      // Mock API responses
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
      // Mock Auth0 useUser hook
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: mockAuth0User,
        isLoading: false,
        error: null,
      });

      // Mock API responses
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
      // Mock Auth0 useUser hook to return loading state
      const useAuth0User = require('@auth0/nextjs-auth0/client').useUser;
      useAuth0User.mockReturnValue({
        user: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useUserContext(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      // Update mock to finish loading
      useAuth0User.mockReturnValue({
        user: mockAuth0User,
        isLoading: false,
        error: null,
      });

      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { user: mockUserData },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Authentication Actions', () => {
    let originalWindow: Window & typeof globalThis;

    beforeEach(() => {
      originalWindow = window;
      // @ts-ignore
      window = {
        ...window,
        location: {
          ...window.location,
          href: '',
        },
      };
    });

    afterEach(() => {
      window = originalWindow;
    });

    it('should provide login function', () => {
      const { result } = renderHook(() => useUserContext(), { wrapper });

      act(() => {
        result.current.login();
      });

      expect(window.location.href).toBe('/api/auth/login');
    });

    it('should provide logout function', () => {
      const { result } = renderHook(() => useUserContext(), { wrapper });

      act(() => {
        result.current.logout();
      });

      expect(window.location.href).toBe('/api/auth/logout');
    });
  });
});
