import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';

describe('Tabs — SSR', () => {
  it('renders explicit trigger and owned-content wiring with stable value IDs', () => {
    const html = renderToString(
      createElement(Tabs, {
        id: 'project-tabs',
        active: 'one value',
        children: [
          createElement(TabsList, {
            'aria-label': 'Project sections',
            children: createElement(TabsTrigger, { value: 'one value', children: 'One' }),
          }),
          createElement(TabsContent, { value: 'one value', children: 'Project summary' }),
        ],
      }),
    );
    expect(html).toContain('data-lyra-tabs=""');
    expect(html).toContain('id="project-tabs-tab-one%20value"');
    expect(html).toContain('aria-controls="project-tabs-panel-one%20value"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('Project summary');
  });

  it('keeps an invalid active value deterministically unselected and hidden', () => {
    const html = renderToString(
      createElement(Tabs, {
        id: 'tabs',
        active: 'missing',
        children: [
          createElement(TabsList, {
            'aria-label': 'Project sections',
            children: createElement(TabsTrigger, { value: 'one', children: 'One' }),
          }),
          createElement(TabsContent, { value: 'one', children: 'Project summary' }),
        ],
      }),
    );
    expect(html).toContain('aria-selected="false"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('hidden=""');
  });
});
