// SSR test template (D-26) — runs in the "ssr" vitest project (environment: node).
// renderToString proves no module-scope DOM access and that the null paths survive the server.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Camera } from 'lucide-react';
import { Icon } from './index';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Icon — SSR', () => {
  it('renderToString of a registry icon emits an svg carrying .lyra-icon', () => {
    const html = renderToString(createElement(Icon, { name: 'check' }));
    expect(typeof html).toBe('string');
    expect(html).toContain('<svg');
    expect(html).toContain('lyra-icon');
  });

  it('renderToString of the icon escape hatch renders the passed component', () => {
    const html = renderToString(createElement(Icon, { icon: Camera, title: 'Camera' }));
    expect(html).toContain('<svg');
    expect(html).toContain('lyra-icon');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Camera"');
  });

  it('renderToString of an unknown name returns an empty string (null path, no throw)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const html = renderToString(createElement(Icon, { name: 'nope' as never }));
    expect(html).toBe('');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('renderToString with no name and no icon returns an empty string without crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const html = renderToString(createElement(Icon, {}));
    expect(html).toBe('');
    expect(warn).not.toHaveBeenCalled();
  });
});
