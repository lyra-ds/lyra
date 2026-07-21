import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { IconButton } from './index';
describe('IconButton SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(IconButton, { label: 'Close', children: '×' }))).toContain(
      'lyra-btn--icon',
    ));
});
