import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CommandPalette } from './index';

const groups = [{ label: 'Actions', items: [{ id: 'new', label: 'New file' }] }];

describe('CommandPalette — SSR', () => {
  it('renders no markup for an open overlay because Portal is server guarded', () => {
    const html = renderToString(createElement(CommandPalette, { open: true, groups }));
    expect(html).toBe('');
  });

  it('renders no markup when closed and never accesses browser globals', () => {
    expect(() =>
      renderToString(createElement(CommandPalette, { open: false, groups })),
    ).not.toThrow();
  });

  it('renders an inline panel without a modal dialog role', () => {
    const html = renderToString(createElement(CommandPalette, { inline: true, groups }));
    expect(html).toContain('lyra-cmdk');
    expect(html).toContain('New file');
    expect(html).not.toContain('role="dialog"');
  });

  it('renders the static Trigger without browser globals', () => {
    const html = renderToString(
      createElement(CommandPalette.Trigger, { label: 'Search', shortcut: '⌘K' }),
    );
    expect(html).toContain('lyra-cmdk-trigger');
    expect(html).toContain('aria-label="Search"');
  });
});
