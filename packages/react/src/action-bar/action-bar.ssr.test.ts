import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActionBar } from './index';

describe('ActionBar — SSR', () => {
  it('renders an announced count without throwing', () => {
    const html = renderToString(createElement(ActionBar, { count: 2 }));
    expect(html).toContain('lyra-actionbar');
    expect(html).toContain('role="status"');
  });
});
