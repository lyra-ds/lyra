import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Badge } from './index';
describe('Badge SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Badge, { children: 'Status' }))).toContain('lyra-badge'));
});
