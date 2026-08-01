import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Shell } from './index';

describe('Shell SSR', () => {
  it('renders the main content and optional slots without throwing', () => {
    const html = renderToString(
      createElement(Shell, { sidebar: 'Navigation', topbar: 'Toolbar', aside: 'Contents' }, 'Body'),
    );

    expect(html).toContain('<main class="lyra-shell__main">');
    expect(html).toContain('lyra-shell__sidebar');
    expect(html).toContain('lyra-shell__topbar');
    expect(html).toContain('lyra-shell__aside');
  });
});
