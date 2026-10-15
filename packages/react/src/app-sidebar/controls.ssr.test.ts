import { createElement as h, createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AppSidebar, AppSidebarOffcanvas, AppSidebarTrigger } from './index';
import { Tooltip } from '../tooltip';

describe('sidebar controls SSR', () => {
  it('renders a controlled native button without registering browser work', () => {
    const html = renderToString(
      h(AppSidebarTrigger, {
        ref: createRef<HTMLButtonElement>(),
        controls: 'workspace',
        collapsed: true,
        hotkey: true,
        onCollapsedChange: () => {
          throw new Error('SSR must not act');
        },
        type: 'submit',
      }),
    );
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-controls="workspace"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Toggle sidebar"');
    expect(html).toContain('lyra-btn--ghost');
  });

  it.each([false, true])('omits portaled offcanvas navigation during SSR (open=%s)', (open) => {
    expect(
      renderToString(
        h(AppSidebarOffcanvas, {
          open,
          onClose: () => {},
          title: 'Workspace',
          children: h(AppSidebar, { 'aria-label': 'Application navigation' }),
        }),
      ),
    ).toBe('');
  });

  it('keeps rail names and destinations without duplicate native hints', () => {
    const html = renderToString(
      h(
        AppSidebar,
        {
          collapsed: true,
          railTooltips: true,
          density: 'compact',
          groups: [
            { items: [{ id: 'reports', label: 'Reports', href: '/reports', active: true }] },
          ],
        },
        h(Tooltip, {
          tip: 'Settings',
          escapeClipping: true,
          children: h(
            'a',
            { href: '/settings' },
            h('span', { className: 'lyra-sbgroup__item-label' }, 'Settings'),
          ),
        }),
      ),
    );
    expect(html).toContain('lyra-appsidebar--compact');
    expect(html).toContain('aria-label="Reports"');
    expect(html).toContain('aria-label="Settings"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/reports"');
    expect(html).not.toContain('title="Reports"');
    expect(html).not.toContain('title="Settings"');
  });
});
