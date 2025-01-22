import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/providers/LanguageStore';
import axios from 'axios';
import Cookies from 'js-cookie';
import { vi, describe, test, beforeEach, expect } from 'vitest';

vi.mock('axios');
vi.mock('js-cookie');

describe('LanguageStore Integration', () => {
  const mockedAxios = axios as unknown as { 
    post: ReturnType<typeof vi.fn>,
    get: ReturnType<typeof vi.fn>
  };
  const mockedCookies = Cookies as unknown as {
    get: ReturnType<typeof vi.fn>,
    set: ReturnType<typeof vi.fn>
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
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
