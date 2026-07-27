// SSR test template (D-26) — runs in the "ssr" vitest project (environment: node).
// renderToString proves the pilot has no module-scope DOM access and survives server rendering.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Button, type ButtonProps } from './index';

const VARIANTS: NonNullable<ButtonProps['variant']>[] = [
  'primary',
  'secondary',
  'soft',
  'ghost',
  'danger',
];

describe('Button — SSR', () => {
  it('renderToString of every variant returns a string with the right class (no throw)', () => {
    for (const variant of VARIANTS) {
      const html = renderToString(createElement(Button, { variant }, 'Save changes'));
      expect(typeof html).toBe('string');
      expect(html).toContain(`lyra-btn--${variant}`);
      expect(html).toContain('lyra-btn__label');
    }
  });

  it('renderToString of a loading button emits the spinner and aria-busy on the server', () => {
    const html = renderToString(createElement(Button, { loading: true }, 'Deleting…'));
    expect(html).toContain('lyra-btn__spinner');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled');
  });

  it('renderToString of asChild emits the child element with button classes and label', () => {
    const html = renderToString(
      createElement(Button, { asChild: true }, createElement('a', { href: '/browse' }, 'Browse')),
    );
    expect(html).toContain('<a');
    expect(html).toContain('href="/browse"');
    expect(html).toContain('lyra-btn lyra-btn--primary lyra-btn--md');
    expect(html).toContain('<span class="lyra-btn__label">Browse</span>');
  });
});
