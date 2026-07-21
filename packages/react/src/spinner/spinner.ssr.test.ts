import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Spinner } from './index';
describe('Spinner SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Spinner))).toContain('lyra-spinner'));
});
