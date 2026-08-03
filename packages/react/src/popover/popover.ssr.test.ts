import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Popover } from './index';

describe('Popover — SSR', () => {
  it('renders an open in-flow panel without accessing browser globals', () => {
    const html = renderToString(
      createElement(Popover, {
        defaultOpen: true,
        trigger: createElement('button', { type: 'button' }, 'Options'),
        children: 'Panel content',
      }),
    );

    expect(html).toContain('lyra-popover-anchor');
    expect(html).toContain('lyra-popover');
    expect(html).toContain('Panel content');
  });
});
