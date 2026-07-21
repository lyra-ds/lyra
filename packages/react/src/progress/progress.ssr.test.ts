import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Progress } from './index';
describe('Progress SSR', () => {
  it('renders without throwing', () =>
    expect(
      renderToString(createElement(Progress, { value: 50, 'aria-label': 'Progress' })),
    ).toContain('aria-valuenow="50"'));
});
