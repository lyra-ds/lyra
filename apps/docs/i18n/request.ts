import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale } from '@/lib/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
