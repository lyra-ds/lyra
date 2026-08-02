import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'Lyra DS — CSS-first design system for SaaS products';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'flex-start',
        background: '#121430', // Matches --indigo-950 in @lyra-ds/styles/tokens/colors.css.
        color: '#EEF0FE',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        padding: '96px',
        width: '100%',
      }}
    >
      <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: '0.18em' }}>LYRA</div>
      <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: '-0.05em', marginTop: 20 }}>
        Design System
      </div>
      <div style={{ color: '#C6C8F5', fontSize: 34, marginTop: 28 }}>
        CSS-first design system for SaaS products
      </div>
    </div>,
    size,
  );
}
