import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Toast, ToastStack } from './index';

describe('Toast — SSR', () => {
  it('renders a toast and its stack without throwing', () => {
    const html = renderToString(
      createElement(ToastStack, null, createElement(Toast, { tone: 'success', children: 'Saved' })),
    );
    expect(html).toContain('lyra-toast-stack');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('role="status"');
  });

  it('keeps role="status" on a standalone toast', () => {
    expect(renderToString(createElement(Toast, { children: 'Saved' }))).toContain('role="status"');
  });
});
