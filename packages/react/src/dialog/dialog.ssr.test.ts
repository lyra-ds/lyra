// SSR test template (D-26) — runs in the "ssr" vitest project (environment: node).
// renderToString proves the overlay pilot has NO module-scope DOM access and that the Portal
// SSR guard renders null server-side: an open Dialog produces a string with no overlay markup
// and throws nothing (D-21/D-26). This is the shape Phase 4 Drawer/CommandPalette/Toast copy.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Dialog } from './index';

describe('Dialog — SSR', () => {
  it('renderToString of an OPEN dialog returns a string with NO overlay/panel markup', () => {
    const html = renderToString(
      createElement(Dialog, {
        open: true,
        title: 'Server',
        onClose: () => {},
        children: 'Body content',
      }),
    );
    expect(typeof html).toBe('string');
    // The Portal renders null on the server pass → none of the dialog DOM appears.
    expect(html).not.toContain('lyra-dialog-overlay');
    expect(html).not.toContain('lyra-dialog');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('Body content');
  });

  it('renderToString of a CLOSED dialog also yields no markup and no throw', () => {
    const html = renderToString(
      createElement(Dialog, { open: false, title: 'Closed', children: 'Body' }),
    );
    expect(typeof html).toBe('string');
    expect(html).not.toContain('lyra-dialog');
  });

  it('does not throw when rendered with a container prop server-side', () => {
    expect(() =>
      renderToString(
        createElement(Dialog, { open: true, title: 'Guarded', container: undefined, children: 'x' }),
      ),
    ).not.toThrow();
  });
});
