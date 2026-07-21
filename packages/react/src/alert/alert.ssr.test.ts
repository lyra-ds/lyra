import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Alert } from './index';
describe('Alert SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Alert, { children: 'Message' }))).toContain('lyra-alert'));
});
