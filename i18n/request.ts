import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Use cookies() in an async context
  const cookieStore = await cookies();
  const locale = cookieStore.get('language')?.value || 'ro';
  console.log('Server', locale);

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
    timeZone: 'Europe/Bucharest'
  };
});
