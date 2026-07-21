import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Stat } from './index';
describe('Stat SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Stat, { label: 'Revenue', value: '48' }))).toContain(
      'lyra-stat__value',
    ));
});
