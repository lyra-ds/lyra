import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];
const headingGap = 1_600;
const topSpacer = 1_200;

Alpine.plugin(lyra);

function mountTableOfContents({ modelable = false }: { modelable?: boolean } = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div ${modelable ? `x-data="{ outer: '' }"` : ''}>
      <nav
        class="lyra-toc"
        aria-label="On this page"
        x-data="lyraTableOfContents()"
        ${modelable ? 'x-modelable="activeId" x-model="outer"' : ''}
      >
        <span class="lyra-toc__title">On this page</span>
        <ul class="lyra-toc__list">
          <li data-level="2"><a class="lyra-toc__link" href="#overview" x-bind="link">Overview</a></li>
          <li data-level="2"><a class="lyra-toc__link" href="#install" x-bind="link">Install</a></li>
          <li data-level="3"><a class="lyra-toc__link lyra-toc__link--active" href="#api%20guide" x-bind="link">API guide</a></li>
          <li data-level="2"><a class="lyra-toc__link" href="#missing" x-bind="link">Missing</a></li>
        </ul>
      </nav>
      <button type="button" data-testid="external-active" x-on:click="outer = 'api guide'">Set API guide</button>
      <main>
        <div style="height: ${topSpacer}px"></div>
        <h2 id="overview">Overview</h2>
        <div style="height: ${headingGap}px"></div>
        <h2 id="install">Install</h2>
        <div style="height: ${headingGap}px"></div>
        <h2 id="api guide">API guide</h2>
        <!-- Short tail: at maximum scroll the last heading sits BELOW the top-30% observation
             band, so only the document-end branch can activate it (the nearest-preceding
             fallback would pick the previous heading instead). -->
        <div style="height: 120px"></div>
      </main>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function link(host: HTMLElement, href: string): HTMLAnchorElement {
  const element = host.querySelector<HTMLAnchorElement>(`a[href="${href}"]`);
  if (!element) throw new Error(`Expected link for ${href}`);
  return element;
}

function heading(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Expected heading ${id}`);
  return element;
}

function scrollHeadingIntoTopBand(target: HTMLElement): void {
  window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top - 8);
  window.dispatchEvent(new Event('scroll'));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  window.scrollTo(0, 0);
});

describe('lyraTableOfContents', () => {
  it('tracks real heading positions from the first heading through the document end', async () => {
    const host = mountTableOfContents();
    const overview = link(host, '#overview');
    const install = link(host, '#install');
    const apiGuide = link(host, '#api%20guide');
    const missing = link(host, '#missing');

    await vi.waitFor(() => expect(overview.classList).toContain('lyra-toc__link--active'));
    expect(overview.getAttribute('aria-current')).toBe('location');
    expect(apiGuide.classList).not.toContain('lyra-toc__link--active');
    expect(apiGuide.getAttribute('aria-current')).toBeNull();
    expect(missing.classList).not.toContain('lyra-toc__link--active');

    scrollHeadingIntoTopBand(heading('install'));
    await vi.waitFor(() => expect(install.classList).toContain('lyra-toc__link--active'));
    expect(install.getAttribute('aria-current')).toBe('location');
    expect(overview.classList).not.toContain('lyra-toc__link--active');

    window.scrollTo(0, document.documentElement.scrollHeight);
    window.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect(apiGuide.classList).toContain('lyra-toc__link--active'));
    expect(apiGuide.getAttribute('aria-current')).toBe('location');
    expect(host.querySelectorAll('a.lyra-toc__link--active')).toHaveLength(1);
  });

  it('synchronizes activeId with x-modelable in both directions', async () => {
    const host = mountTableOfContents({ modelable: true });
    const apiGuide = link(host, '#api%20guide');
    const install = link(host, '#install');
    const externalControl = host.querySelector<HTMLButtonElement>(
      '[data-testid="external-active"]',
    );
    if (!externalControl) throw new Error('Expected external active control');

    await vi.waitFor(() =>
      expect(link(host, '#overview').getAttribute('aria-current')).toBe('location'),
    );
    externalControl.click();
    await vi.waitFor(() => expect(apiGuide.classList).toContain('lyra-toc__link--active'));

    scrollHeadingIntoTopBand(heading('install'));
    await vi.waitFor(() => expect(install.classList).toContain('lyra-toc__link--active'));
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: string }).outer).toBe(
      'install',
    );
  });

  it('is axe clean', async () => {
    const host = mountTableOfContents();

    await vi.waitFor(() =>
      expect(link(host, '#overview').getAttribute('aria-current')).toBe('location'),
    );
    await expectNoAxeViolations(host);
  });
});
