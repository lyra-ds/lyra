import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Grid } from './index';

describe('Grid SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Grid, { columns: 3 }, 'Content'))).toContain('lyra-grid'));
});
