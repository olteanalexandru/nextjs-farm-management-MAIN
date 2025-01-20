import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/app/providers/LanguageStore';
import axios from 'axios';
import Cookies from 'js-cookie';

jest.mock('axios');
jest.mock('js-cookie');

describe('LanguageStore Integration', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { reload: jest.fn() },
      writable: true
    });
  });

  test('initializes with default language from cookie', () => {
    mockedCookies.get.mockReturnValueOnce('ro');

    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    });

    expect(result.current.currentLanguage).toBe('ro');
  });

  test('changes language and updates cookie', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    });

    await act(async () => {
      await result.current.setLanguage('ro');
    });

    expect(mockedCookies.set).toHaveBeenCalledWith('language', 'ro');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/Controllers/SetLanguage',
      { locale: 'ro' }
    );
    expect(window.location.reload).toHaveBeenCalled();
  });
});
