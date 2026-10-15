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

  it('keeps explicit false identical to the default and escape mode inert on the server', () => {
    const props = {
      id: 'help',
      tip: 'Help',
      children: createElement('button', { 'aria-describedby': 'existing' }, 'Info'),
    };
    expect(renderToString(createElement(Tooltip, { ...props, escapeClipping: false }))).toBe(
      renderToString(createElement(Tooltip, props)),
    );
    const html = renderToString(createElement(Tooltip, { ...props, escapeClipping: true }));
    expect(html).toContain('aria-describedby="existing ');
    expect(html).toContain('role="tooltip" hidden=""');
    expect(html).toContain('data-state="closed"');
    expect(html).toContain('lyra-tooltip--escape');
    expect(html).not.toContain('popover=');
    expect(html).not.toContain('escapeClipping');
  });
});
