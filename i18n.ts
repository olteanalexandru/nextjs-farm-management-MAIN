import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const locale = cookieStore.get('language')?.value || 'ro';
  console.log(locale);

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});