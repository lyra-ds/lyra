import { Card, Stack } from '@lyra-ds/react';

const faviconAssets = [
  { src: '/favicon-512.png', size: 96, label: '512 · PWA' },
  { src: '/favicon-180.png', size: 60, label: '180 · apple-touch' },
  { src: '/favicon-32.png', size: 32, label: '32 · PNG' },
  { src: '/favicon.svg', size: 32, label: 'SVG' },
] as const;

export function BrandingFavicon() {
  return (
    <Stack gap={6}>
      <Stack direction="row" align="end" gap={8} wrap>
        {faviconAssets.map((asset) => (
          <Stack align="center" gap={2} key={asset.src}>
            <img alt="Lyra favicon" height={asset.size} src={asset.src} width={asset.size} />
            <code>{asset.label}</code>
          </Stack>
        ))}
      </Stack>
      <Card padded>
        <Stack direction="row" align="center" gap={2}>
          <img alt="" height={16} src="/favicon.svg" width={16} />
          <span>Lyra · Dashboard</span>
        </Stack>
      </Card>
    </Stack>
  );
}
