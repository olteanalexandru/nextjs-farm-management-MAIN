import { cookies } from 'next/headers';
import { Locale } from './i18n-client';

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = cookies();
  return (cookieStore.get('language')?.value as Locale) || 'en';
}

export async function getServerMessages(locale: Locale) {
  try {
    return (await import(`../locales/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to English messages
    return (await import('../locales/en.json')).default;
  }
}
