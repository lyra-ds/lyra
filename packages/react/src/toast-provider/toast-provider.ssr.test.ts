import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './index';

describe('ToastProvider — SSR', () => {
  it('keeps notification calls safe and timer-free during server rendering', () => {
    function ServerNotification() {
      const { info } = useToast();
      return createElement('span', null, `Server notification ${info('Server message')}`);
    }
    vi.useFakeTimers();
    try {
      const html = renderToString(
        createElement(ToastProvider, { children: createElement(ServerNotification) }),
      );
      expect(html).toContain('Server notification 1');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders a persistent named region without adding a third live region', () => {
    const html = renderToString(createElement(ToastProvider, { children: 'Server content' }));
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Notifications"');
    expect(html).toContain('tabindex="-1"');
    expect(html.match(/aria-live=/g)).toHaveLength(2);
    expect(html.match(/aria-relevant="additions"/g)).toHaveLength(2);
  });

  it('renders its children without touching browser APIs', () => {
    expect(renderToString(createElement(ToastProvider, { children: 'Server content' }))).toContain(
      'Server content',
    );
  });

  it('renders an authored notification landmark name on the server', () => {
    const html = renderToString(
      createElement(ToastProvider, { 'aria-label': 'Project notifications', children: 'Content' }),
    );
    expect(html).toContain('aria-label="Project notifications"');
    expect(html.match(/aria-live=/g)).toHaveLength(2);
  });
});
