import { renderHook, act } from '@testing-library/react';
import { GlobalContextProvider, useGlobalContextRotation } from '@/providers/rotationStore';
import axios from 'axios';

jest.mock('axios');
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'test-user-id' } })
}));

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
    jest.clearAllMocks();
  });

  test('generates and manages crop rotation', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.post.mockResolvedValueOnce({ status: 201, data: [mockRotation] });
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [mockRotation] });

    const { result } = renderHook(() => useGlobalContextRotation(), {
      wrapper: GlobalContextProvider
    });

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

    expect(result.current.cropRotation).toEqual([mockRotation]);
    expect(result.current.isSuccess).toBe(true);

    // Test fetching rotations
    await act(async () => {
      await result.current.getCropRotation();
    });

    expect(result.current.cropRotation).toEqual([mockRotation]);
    expect(result.current.error).toBeNull();
  });

  test('handles nitrogen balance updates', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.put.mockResolvedValueOnce({ 
      status: 200, 
      data: [{ ...mockRotation, nitrogenBalance: 60 }] 
    });

    const { result } = renderHook(() => useGlobalContextRotation(), {
      wrapper: GlobalContextProvider
    });

    await act(async () => {
      await result.current.updateNitrogenBalanceAndRegenerateRotation({
        rotationName: 'Test Rotation',
        year: 2023,
        division: 1,
        nitrogenBalance: 60
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/updateNitrogenBalance/rotation/'),
      expect.any(Object)
    );
  });
});
