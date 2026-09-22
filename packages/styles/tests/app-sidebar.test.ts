import { afterEach, describe, expect, it } from 'vitest';
import { commands } from 'vitest/browser';
import '../styles.css';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateFileUploadMedia(options: {
      forcedColors?: 'active' | 'none';
      reducedMotion?: 'reduce' | 'no-preference';
    }): Promise<void>;
  }
}

const fixture = (): void => {
  document.body.innerHTML = `
    <div class="lyra-shell lyra-shell--content lyra-shell--has-sidebar" data-probe="content-shell">
      <aside class="lyra-shell__sidebar" data-probe="app-rail">
        <nav class="lyra-appsidebar" data-probe="app-sidebar"></nav>
      </aside>
      <main class="lyra-shell__main">Content</main>
    </div>
    <div class="lyra-shell lyra-shell--content lyra-shell--has-sidebar" style="--shell-sidebar: 312px" data-probe="ordinary-shell">
      <aside class="lyra-shell__sidebar" data-probe="ordinary-rail">Navigation</aside>
      <main class="lyra-shell__main">Content</main>
    </div>
    <nav class="lyra-appsidebar lyra-appsidebar--rail" data-probe="rail-sidebar">
      <div class="lyra-appsidebar__brand" data-probe="rail-brand">
        <div class="lyra-wssw">
          <button class="lyra-wssw__trigger">Acme</button>
          <div class="lyra-wssw__pop" data-probe="rail-popover">Workspaces</div>
        </div>
      </div>
    </nav>
    <nav class="lyra-appsidebar" style="--appsidebar-width: 296px" data-probe="custom-sidebar"></nav>`;
};

const probe = (name: string): HTMLElement => {
  const element = document.querySelector<HTMLElement>(`[data-probe="${name}"]`);
  if (!element) throw new Error(`Missing ${name} probe`);
  return element;
};

afterEach(async () => {
  await commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
  document.body.innerHTML = '';
});

describe('CSS-only AppSidebar width and motion contract', () => {
  it('defaults to 260px, uses a 64px rail, and keeps a consumer custom width', () => {
    fixture();

    expect(getComputedStyle(probe('app-sidebar')).width).toBe('260px');
    expect(getComputedStyle(probe('rail-sidebar')).width).toBe('64px');
    expect(getComputedStyle(probe('custom-sidebar')).width).toBe('296px');
  });

  it('lets a direct content-shell AppSidebar own its rail without changing ordinary Shell rails', () => {
    fixture();

    expect(probe('app-rail').getBoundingClientRect().width).toBeCloseTo(260, 1);
    expect(probe('ordinary-rail').getBoundingClientRect().width).toBeCloseTo(312, 1);
  });

  it('lets a rail WorkspaceSwitcher popover extend beyond its brand without clipping', () => {
    fixture();
    const brand = probe('rail-brand');
    const popover = probe('rail-popover');

    expect(getComputedStyle(brand).overflowX).toBe('visible');
    expect(popover.getBoundingClientRect().width).toBeGreaterThanOrEqual(200);
    expect(popover.getBoundingClientRect().right).toBeGreaterThan(
      brand.getBoundingClientRect().right,
    );
    expect(Number.parseInt(getComputedStyle(popover).zIndex, 10)).toBeGreaterThan(0);
  });

  it('preserves rail WorkspaceSwitcher geometry in forced colors', async () => {
    fixture();
    await commands.emulateFileUploadMedia({ forcedColors: 'active' });
    const trigger = probe('rail-sidebar').querySelector<HTMLElement>('.lyra-wssw__trigger');
    if (!trigger) throw new Error('Missing rail WorkspaceSwitcher trigger');

    expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(trigger.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(trigger.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(getComputedStyle(probe('rail-brand')).overflowX).toBe('visible');
  });

  it('removes only the AppSidebar width transition under reduced motion', async () => {
    fixture();
    const sidebar = probe('app-sidebar');

    expect(getComputedStyle(sidebar).transitionProperty).toContain('width');
    expect(Number.parseFloat(getComputedStyle(sidebar).transitionDuration)).toBeGreaterThan(0);

    await commands.emulateFileUploadMedia({ reducedMotion: 'reduce' });
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    expect(getComputedStyle(sidebar).transitionDuration).toBe('0s');
  });
});
