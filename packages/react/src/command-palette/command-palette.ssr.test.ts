import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './index';

const groups = [{ label: 'Actions', items: [{ id: 'new', label: 'New file' }] }];

describe('CommandPalette — SSR', () => {
  it('renders no markup for an open overlay because Portal is server guarded', () => {
    const returnFocusTo = vi.fn(() => null);
    const initialFocusTo = vi.fn(() => null);
    const html = renderToString(
      createElement(CommandPalette, { open: true, groups, returnFocusTo, initialFocusTo }),
    );
    expect(html).toBe('');
    expect(returnFocusTo).not.toHaveBeenCalled();
    expect(initialFocusTo).not.toHaveBeenCalled();
  });

  it('renders no markup when closed and never accesses browser globals', () => {
    expect(() =>
      renderToString(createElement(CommandPalette, { open: false, groups })),
    ).not.toThrow();
  });

  it('renders an inline panel without a modal dialog role', () => {
    const returnFocusTo = vi.fn(() => null);
    const initialFocusTo = vi.fn(() => null);
    const html = renderToString(
      createElement(CommandPalette, { inline: true, groups, returnFocusTo, initialFocusTo }),
    );
    expect(html).toContain('lyra-cmdk');
    expect(html).toContain('New file');
    expect(html).not.toContain('role="dialog"');
    expect(returnFocusTo).not.toHaveBeenCalled();
    expect(initialFocusTo).not.toHaveBeenCalled();
  });

  it('renders the static Trigger without browser globals', () => {
    const html = renderToString(
      createElement(CommandPalette.Trigger, { label: 'Search', shortcut: '⌘K' }),
    );
    expect(html).toContain('lyra-cmdk-trigger');
    expect(html).toContain('aria-label="Search"');
  });
});
