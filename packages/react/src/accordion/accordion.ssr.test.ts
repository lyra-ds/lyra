import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Accordion } from './index';
describe('Accordion — SSR', () => {
  it('renders an open item', () => {
    const html = renderToString(
      createElement(Accordion, {
        items: [{ id: 'one', title: 'One', content: 'Content' }],
        defaultOpen: 'one',
      }),
    );
    expect(html).toContain('lyra-acc__item--open');
    expect(html).toContain('aria-expanded="true"');
  });
});
