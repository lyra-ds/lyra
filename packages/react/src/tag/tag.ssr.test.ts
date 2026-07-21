import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Tag } from './index';
describe('Tag SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Tag, { children: 'Filter' }))).toContain('lyra-tag'));
});
