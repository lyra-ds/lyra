import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'Lyra DS — CSS-first design system for SaaS products';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#121430', // Matches --indigo-950 in @lyra-ds/styles/tokens/colors.css.
        color: '#EEF0FE',
        display: 'flex',
        height: '100%',
        justifyContent: 'space-between',
        padding: '96px',
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: '0.18em' }}>LYRA</div>
        <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: '-0.05em', marginTop: 20 }}>
          Design System
        </div>
        <div style={{ color: '#C6C8F5', fontSize: 34, marginTop: 28 }}>
          CSS-first design system for SaaS products
        </div>
      </div>
      {/* The Lyra mark (handoff/assets/github/org-avatar.svg), brand indigo on the dark card. */}
      <svg width="300" height="300" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
        <path
          d="M32 12C35.2 25.3 40.1 30.2 53.4 33.4C40.1 36.6 35.2 41.5 32 54.8C28.8 41.5 23.9 36.6 10.6 33.4C23.9 30.2 28.8 25.3 32 12Z"
          fill="#5B5BD6"
          transform="translate(0 -1.4)"
        />
      </svg>
    </div>,
    size,
  );
}
