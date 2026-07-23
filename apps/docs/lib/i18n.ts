import type { I18nConfig } from 'fumadocs-core/i18n';

export const locales = ['en', 'pt-BR'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const fumadocsI18n: I18nConfig = {
  defaultLanguage: defaultLocale,
  languages: [...locales],
  fallbackLanguage: defaultLocale,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
