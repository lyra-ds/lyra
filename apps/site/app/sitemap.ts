import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const origin = 'https://lyra-ds.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${origin}/en`,
      alternates: {
        languages: { en: `${origin}/en`, 'pt-BR': `${origin}/pt-BR`, 'x-default': `${origin}/en` },
      },
    },
    {
      url: `${origin}/pt-BR`,
      alternates: {
        languages: { en: `${origin}/en`, 'pt-BR': `${origin}/pt-BR`, 'x-default': `${origin}/en` },
      },
    },
    {
      url: `${origin}/en/privacy`,
      alternates: {
        languages: {
          en: `${origin}/en/privacy`,
          'pt-BR': `${origin}/pt-BR/privacy`,
          'x-default': `${origin}/en/privacy`,
        },
      },
    },
    {
      url: `${origin}/pt-BR/privacy`,
      alternates: {
        languages: {
          en: `${origin}/en/privacy`,
          'pt-BR': `${origin}/pt-BR/privacy`,
          'x-default': `${origin}/en/privacy`,
        },
      },
    },
  ];
}
