import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from './index';

describe('ToastProvider — SSR', () => {
  it('renders its children without touching browser APIs', () => {
    expect(renderToString(createElement(ToastProvider, { children: 'Server content' }))).toContain(
      'Server content',
    );
  });
});
