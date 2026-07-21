import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Skeleton } from './index';
describe('Skeleton SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Skeleton))).toContain('lyra-skeleton'));
});
