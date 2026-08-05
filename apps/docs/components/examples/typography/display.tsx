import { Stack } from '@lyra-ds/react';

const headings = [
  [
    'display',
    '--display-font',
    '--tracking-display',
    '48px / 1.15 · 800 · -0.03em',
    'Build with Lyra',
  ],
  ['h1', '--h1-font', '--tracking-heading', '30px / 1.3 · 700 · -0.02em', 'Components that scale'],
  [
    'h2',
    '--h2-font',
    '--tracking-heading',
    '24px / 1.3 · 700 · -0.02em',
    'For every product surface',
  ],
  ['h3', '--h3-font', '--tracking-normal', '20px / 1.3 · 600 · 0', 'A clear visual hierarchy'],
] as const;

export function TypographyDisplay() {
  return (
    <Stack gap={4} aria-label="Display and heading fonts">
      {headings.map(([name, font, tracking, details, sample]) => (
        <Stack gap={1} key={name}>
          <span
            style={{
              color: 'var(--text-primary)',
              font: `var(${font})`,
              letterSpacing: `var(${tracking})`,
            }}
          >
            {sample}
          </span>
          <code>{`${font} · ${tracking} · ${details}`}</code>
        </Stack>
      ))}
    </Stack>
  );
}
