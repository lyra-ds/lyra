import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider, useTheme } from './index';

describe('ThemeProvider SSR', () => {
  it('renders children without touching a browser API', () => {
    // The handoff version read localStorage inside useState, which runs on the server pass.
    // Rendering here at all is the assertion: no window, no localStorage, no matchMedia.
    expect(renderToString(createElement(ThemeProvider, { children: 'Body' }))).toContain('Body');
  });

  it('reports the default theme on the server, so hydration has something stable to match', () => {
    function Probe() {
      const { theme, resolvedTheme, dark } = useTheme();
      return createElement('span', null, `${theme}/${resolvedTheme}/${dark}`);
    }
    const html = renderToString(
      createElement(ThemeProvider, { defaultTheme: 'dark', children: createElement(Probe) }),
    );
    expect(html).toContain('dark/dark/true');
  });

  it('resolves an unset system preference to light on the server rather than guessing', () => {
    function Probe() {
      return createElement('span', null, useTheme().resolvedTheme);
    }
    const html = renderToString(createElement(ThemeProvider, { children: createElement(Probe) }));
    expect(html).toContain('light');
  });
});
