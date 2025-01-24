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
    _id: '1',
    fieldSize: 100,
    numberOfDivisions: 4,
    rotationName: 'Test Rotation',
    crops: [] as {
      _id: string;
      cropName: string;
      cropType: string;
      cropVariety: string;
      plantingDate: string;
      harvestingDate: string;
      description: string;
      imageUrl: string;
      soilType: string;
      fertilizers: string[];
      pests: string[];
      diseases: string[];
      selectare: boolean;
      user: string;
      ItShouldNotBeRepeatedForXYears: number;
      nitrogenSupply: number;
      nitrogenDemand: number;
      residualNitrogen: number;
    }[],
    maxYears: 3,
    ResidualNitrogenSupply: 50,
    rotationPlan: [] as {
      year: number;
      rotationItems: {
        division: number;
        cropName: string;
        plantingDate: string;
        harvestingDate: string;
        divisionSize: number;
        nitrogenBalance: number;
      }[];
    }[]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches rotations successfully', async () => {
    const mockResponse = { status: 200, data: [mockRotation] };
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
      rotationPlan: [{
        year: 2023,
        rotationItems: [{
          division: 1,
          cropName: 'Test Crop',
          plantingDate: '2023-01-01',
          harvestingDate: '2023-12-31',
          divisionSize: 25,
          nitrogenBalance: 60
        }]
      }]
    };

    mockedAxios.put.mockResolvedValueOnce({
      status: 200,
      data: [updatedRotation]
    });

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
      {
        rotationName: 'Test Rotation',
        year: 2023,
        division: 1,
        nitrogenBalance: 60
      }
    );
  });
});
