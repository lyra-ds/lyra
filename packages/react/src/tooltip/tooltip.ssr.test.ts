import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Tooltip } from './index';
describe('Tooltip — SSR', () => {
  it('renders the accessible tooltip target', () => {
    const html = renderToString(
      createElement(Tooltip, { tip: 'Help', children: createElement('button', null, 'Info') }),
    );
    expect(html).toContain('role="tooltip"');
    expect(html).toContain('data-tip="Help"');
  });
});
