import { renderHook, act, waitFor } from '@testing-library/react';
import { GlobalContextProvider, useGlobalContextRotation } from '@/providers/rotationStore';
import axios from 'axios';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import { UserProvider } from '@auth0/nextjs-auth0/client';

// Mock Auth0
vi.mock('@auth0/nextjs-auth0/client', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({ user: { sub: 'test-user-id' } })
}));

vi.mock('axios');
const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>,
  get: ReturnType<typeof vi.fn>,
  put: ReturnType<typeof vi.fn>
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <GlobalContextProvider>{children}</GlobalContextProvider>
  </UserProvider>
);

describe('RotationStore Integration', () => {
  const mockRotation = {
    _id: '1',
    fieldSize: 100,
    numberOfDivisions: 4,
    rotationName: 'Test Rotation',
    crops: [],
    maxYears: 3,
    ResidualNitrogenSupply: 50,
    rotationPlan: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('generates and manages crop rotation', async () => {
    const responseData = {
      data: [mockRotation]  // Changed structure to match API response
    };
    
    mockedAxios.post.mockResolvedValueOnce(responseData);
    mockedAxios.get.mockResolvedValueOnce(responseData);
  
    const { result } = renderHook(() => useGlobalContextRotation(), { wrapper });
  
    await act(async () => {
      await result.current.generateCropRotation({
        fieldSize: 100,
        numberOfDivisions: 4,
        rotationName: 'Test Rotation',
        crops: [],
        maxYears: 3,
        ResidualNitrogenSupply: 50
      });
    });

    // Use waitFor to ensure state updates are complete
    await waitFor(() => {
      expect(result.current.cropRotation).toEqual([mockRotation]);
      expect(result.current.isSuccess).toBe(true);
    });

    await act(async () => {
      await result.current.getCropRotation();
    });

    await waitFor(() => {
      expect(result.current.cropRotation).toEqual([mockRotation]);
      expect(result.current.error).toBeNull();
    });
  });
  
  test('handles nitrogen balance updates', async () => {
    const responseData = {
      data: [{ ...mockRotation, nitrogenBalance: 60 }]  // Changed structure to match API response
    };
    mockedAxios.put.mockResolvedValueOnce(responseData);
    
    // Mock get request that follows update
    mockedAxios.get.mockResolvedValueOnce(responseData);
  
    const { result } = renderHook(() => useGlobalContextRotation(), { wrapper });
  
    await act(async () => {
      await result.current.updateNitrogenBalanceAndRegenerateRotation({
        rotationName: 'Test Rotation',
        year: 2023,
        division: 1,
        nitrogenBalance: 60
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/updateNitrogenBalance/rotation/'),
      expect.any(Object)
    );

    expect(result.current.cropRotation).toEqual([{ ...mockRotation, nitrogenBalance: 60 }]);
  });
});
