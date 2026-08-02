import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Static export only for production builds — it is irrelevant to `next dev`.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  // Keep LAN/Tailscale previews usable; Next otherwise blocks its own dev resources.
  allowedDevOrigins: [
    '127.0.0.1',
    '10.0.0.156',
    '100.104.172.107',
    'dev.lynx-kelvin.ts.net',
    '*.ts.net',
  ],
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        async headers() {
          return [
            {
              source: '/:path*',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'no-store, no-cache, must-revalidate, max-age=0',
                },
                { key: 'Pragma', value: 'no-cache' },
              ],
            },
          ];
        },
      }),
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
