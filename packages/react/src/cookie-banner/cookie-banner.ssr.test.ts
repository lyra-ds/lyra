import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CookieBanner } from './index';

describe('CookieBanner — SSR', () => {
  it('does not access localStorage and renders nothing before hydration', () => {
    expect(() => renderToString(createElement(CookieBanner))).not.toThrow();
    expect(renderToString(createElement(CookieBanner))).toBe('');
  });
});
