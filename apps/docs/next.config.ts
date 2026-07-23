import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Static export only for production builds — it is irrelevant to `next dev`.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  // Next 16 blocks dev resources (HMR + client bootstrap) from cross-origin hosts,
  // which silently breaks hydration when the site is reached over LAN/Tailscale.
  // Allow the hosts we actually preview from.
  allowedDevOrigins: [
    '127.0.0.1',
    '10.0.0.156',
    '100.104.172.107',
    'dev.lynx-kelvin.ts.net',
    '*.ts.net',
  ],
};

const withMDX = createMDX();
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(withMDX(nextConfig));
