import { getRequestConfig } from 'next-intl/server';
import { getServerLocale, getServerMessages } from 'lib/i18n-server';

export default getRequestConfig(async () => {
  const locale = await getServerLocale();
  const messages = await getServerMessages(locale);

  return {
    locale,
    messages,
    timeZone: 'Europe/Bucharest'
  };
});
