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
const mockedAxios = axios as jest.Mocked<typeof axios>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <GlobalContextProvider>{children}</GlobalContextProvider>
  </UserProvider>
);

describe('RotationStore Integration', () => {
  const mockRotation = {
    id: 1,
    userId: 'db-user-id',
    rotationName: 'Test Rotation',
    fieldSize: 100,
    numberOfDivisions: 4,
    rotationPlans: [] as {
      id: number;
      rotationId: number;
      year: number;
      division: number;
      cropId: number;
      divisionSize: number;
      nitrogenBalance: number;
      crop: any;
    }[]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches rotations successfully', async () => {
    const mockResponse = { status: 200, data: { data: [mockRotation] } };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useGlobalContextRotation(), { wrapper });

    await act(async () => {
      await result.current.getCropRotation();
    });

    // Wait for state updates to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.cropRotation).toEqual([mockRotation]);
    expect(result.current.error).toBeNull();
  });

  test('handles fetch errors correctly', async () => {
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useGlobalContextRotation(), { wrapper });

    await act(async () => {
      await result.current.getCropRotation();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  test('handles nitrogen balance updates', async () => {
    const updatedRotation = {
      ...mockRotation,
      rotationPlans: [{
        id: 1,
        rotationId: 1,
        year: 2023,
        division: 1,
        cropId: 1,
        divisionSize: 25,
        nitrogenBalance: 60,
        crop: { cropName: 'Test Crop' }
      }]
    };

    mockedAxios.put.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Nitrogen balance updated successfully', data: updatedRotation }
    });

    const { result } = renderHook(() => useGlobalContextRotation(), { wrapper });

    await act(async () => {
      await result.current.updateNitrogenBalanceAndRegenerateRotation({
        id: 1,
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
      {
        id: 1,
        year: 2023,
        division: 1,
        nitrogenBalance: 60
      }
    );
  });
});
