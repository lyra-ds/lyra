import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TableOfContents, useScrollSpy } from './index';

function ScrollSpyFixture() {
  const activeId = useScrollSpy(['missing']);
  return createElement('output', null, activeId);
}

describe('TableOfContents — SSR', () => {
  it('renders its labelled navigation without accessing browser globals', () => {
    const html = renderToString(
      createElement(TableOfContents, {
        label: 'On this page',
        activeId: 'install',
        items: [{ id: 'install', text: 'Install', level: 2 }],
      }),
    );

    expect(html).toContain('aria-label="On this page"');
    expect(html).toContain('aria-current="location"');
  });

  it('does not create an observer during server rendering', () => {
    expect(() => renderToString(createElement(ScrollSpyFixture))).not.toThrow();
  });
});
