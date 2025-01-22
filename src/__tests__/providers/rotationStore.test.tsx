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
    mockedAxios.post.mockResolvedValueOnce({ 
      data: [mockRotation]
    });
    mockedAxios.get.mockResolvedValueOnce({ 
      data: [mockRotation]
    });

    const { result } = renderHook(() => useGlobalContextRotation(), { wrapper });

    // Test rotation generation
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

    await waitFor(() => {
      expect(result.current.cropRotation).toEqual([mockRotation]);
      expect(result.current.isSuccess).toBe(true);
    });

    // Test fetching rotations
    await act(async () => {
      await result.current.getCropRotation();
    });

    await waitFor(() => {
      expect(result.current.cropRotation).toEqual([mockRotation]);
      expect(result.current.error).toBeNull();
    });
  });

  test('handles nitrogen balance updates', async () => {
    mockedAxios.put.mockResolvedValueOnce({ 
      data: [{ ...mockRotation, nitrogenBalance: 60 }]
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
      expect.any(Object)
    );
  });
});
