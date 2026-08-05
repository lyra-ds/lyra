import { Stack } from '@lyra-ds/react';

export function TypographyBody() {
  return (
    <Stack gap={3} aria-label="Body typography">
      <span
        style={{
          color: 'var(--text-muted)',
          font: 'var(--overline-font)',
          letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase',
        }}
      >
        Overline · 12px bold caps
      </span>
      <span
        style={{
          color: 'var(--text-primary)',
          fontSize: 'var(--text-md)',
          lineHeight: 'var(--leading-relaxed)',
        }}
      >
        Long-form copy uses 16px with relaxed leading so documentation and articles stay easy to
        read.
      </span>
      <span style={{ color: 'var(--text-secondary)', font: 'var(--body-font)' }}>
        Interface copy uses <code>--body-font</code>: 14px with normal leading for tables, forms,
        menus and cards.
      </span>
      <span style={{ color: 'var(--text-primary)', font: 'var(--body-strong-font)' }}>
        <code>--body-strong-font</code> adds emphasis without changing the text scale.
      </span>
      <span style={{ color: 'var(--text-muted)', font: 'var(--caption-font)' }}>
        <code>--caption-font</code> · 12px medium for hints, timestamps and metadata.
      </span>
    </Stack>
  );
}
