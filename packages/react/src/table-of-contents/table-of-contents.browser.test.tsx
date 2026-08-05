import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { TableOfContents, useScrollSpy } from './index';

type ObserverInstance = {
  callback: IntersectionObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
  options?: IntersectionObserverInit;
};

const observers: ObserverInstance[] = [];

function installObserver(): void {
  class TestIntersectionObserver {
    callback: IntersectionObserverCallback;
    disconnect = vi.fn();
    observe = vi.fn();
    options?: IntersectionObserverInit;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      this.options = options;
      observers.push(this);
    }
  }

  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
}

function ScrollSpyFixture({ ids }: { ids: string[] }) {
  const activeId = useScrollSpy(ids);
  return <output>{activeId}</output>;
}

function ScrollSpyTableFixture({ ids }: { ids: string[] }) {
  const activeId = useScrollSpy(ids);
  return (
    <>
      {ids.map((id) => (
        <h2 key={id} id={id}>
          {id}
        </h2>
      ))}
      <TableOfContents
        label="On this page"
        activeId={activeId}
        items={ids.map((id) => ({ id, text: id, level: 2 }))}
      />
    </>
  );
}

function intersection(
  target: Element,
  top: number,
  isIntersecting = true,
): IntersectionObserverEntry {
  return {
    target,
    isIntersecting,
    boundingClientRect: { top },
  } as unknown as IntersectionObserverEntry;
}

afterEach(async () => {
  await cleanup();
  observers.splice(0);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('TableOfContents', () => {
  it('renders a labelled navigation landmark, nested level, and current in-page location', async () => {
    const { container, ...screen } = await render(
      <TableOfContents
        label="On this page"
        activeId="install"
        items={[
          { id: 'overview', text: 'Overview', level: 2 },
          { id: 'install', text: 'Install', level: 3 },
        ]}
      />,
    );

    const navigation = screen.getByRole('navigation', { name: 'On this page' });
    await expect.element(navigation).toBeInTheDocument();
    await expect.element(screen.getByRole('link', { name: 'Install' })).toBeInTheDocument();
    const activeLink = container.querySelector<HTMLAnchorElement>('a[href="#install"]')!;
    expect(activeLink.className).toBe('lyra-toc__link lyra-toc__link--active');
    expect(activeLink.getAttribute('aria-current')).toBe('location');
    expect(activeLink.closest('li')?.getAttribute('data-level')).toBe('3');
    expect(container.querySelector('a[href="#overview"]')!.getAttribute('aria-current')).toBeNull();
    await expectNoAxeViolations(container);
  });

  it('merges a consumer className after the TableOfContents class', async () => {
    const { container } = await render(
      <TableOfContents className="docs-toc" label="Contents" items={[]} />,
    );

    expect(container.querySelector('nav')!.className).toBe('lyra-toc docs-toc');
  });
});

describe('useScrollSpy', () => {
  it('keeps an active item at the top, in the observation band, and at the document bottom', async () => {
    installObserver();
    const scrollY = vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1_000);
    vi.spyOn(document.body, 'scrollHeight', 'get').mockReturnValue(2_000);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2_000);
    const { container } = await render(<ScrollSpyTableFixture ids={['first', 'middle', 'last']} />);

    expect(observers).toHaveLength(1);
    expect(observers[0].options?.rootMargin).toBe('0px 0px -70% 0px');
    expect(observers[0].observe).toHaveBeenCalledTimes(3);
    await vi.waitFor(() =>
      expect(container.querySelector('a[aria-current="location"]')?.getAttribute('href')).toBe(
        '#first',
      ),
    );
    expect(container.querySelector('a[href="#first"]')!.className).toContain(
      'lyra-toc__link--active',
    );

    const first = document.getElementById('first')!;
    const middle = document.getElementById('middle')!;
    const last = document.getElementById('last')!;
    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue({ top: -240 } as DOMRect);
    vi.spyOn(middle, 'getBoundingClientRect').mockReturnValue({ top: 24 } as DOMRect);
    vi.spyOn(last, 'getBoundingClientRect').mockReturnValue({ top: 800 } as DOMRect);
    observers[0].callback(
      [intersection(middle, 24), intersection(first, -240, false)],
      {} as IntersectionObserver,
    );
    await vi.waitFor(() =>
      expect(container.querySelector('a[aria-current="location"]')?.getAttribute('href')).toBe(
        '#middle',
      ),
    );
    expect(container.querySelector('a[href="#middle"]')!.className).toContain(
      'lyra-toc__link--active',
    );

    scrollY.mockReturnValue(1_000);
    observers[0].callback([intersection(middle, -300, false)], {} as IntersectionObserver);
    window.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() =>
      expect(container.querySelector('a[aria-current="location"]')?.getAttribute('href')).toBe(
        '#last',
      ),
    );
    expect(container.querySelector('a[href="#last"]')!.className).toContain(
      'lyra-toc__link--active',
    );
    expect(container.querySelectorAll('a.lyra-toc__link--active')).toHaveLength(1);
  });

  it('falls back across a short two-heading document and disconnects while ids change or unmount', async () => {
    installObserver();
    const scrollY = vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1_000);
    vi.spyOn(document.body, 'scrollHeight', 'get').mockReturnValue(2_000);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2_000);
    const { container, rerender, unmount } = await render(
      <>
        <h2 id="install">Install</h2>
        <h2 id="usage">Usage</h2>
        <ScrollSpyFixture ids={['missing', 'install', 'usage']} />
      </>,
    );

    expect(observers).toHaveLength(1);
    expect(observers[0].observe).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(container.querySelector('output')!.textContent).toBe('install'));

    const install = document.getElementById('install')!;
    const usage = document.getElementById('usage')!;
    vi.spyOn(install, 'getBoundingClientRect').mockReturnValue({ top: 24, height: 20 } as DOMRect);
    vi.spyOn(usage, 'getBoundingClientRect').mockReturnValue({ top: 120, height: 20 } as DOMRect);
    observers[0].callback(
      [intersection(usage, 120), intersection(install, 24)],
      {} as IntersectionObserver,
    );
    await vi.waitFor(() => expect(container.querySelector('output')!.textContent).toBe('install'));

    observers[0].callback([intersection(install, -10, false)], {} as IntersectionObserver);
    await vi.waitFor(() => expect(container.querySelector('output')!.textContent).toBe('usage'));

    scrollY.mockReturnValue(1_000);
    observers[0].callback([intersection(usage, -10, false)], {} as IntersectionObserver);
    window.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect(container.querySelector('output')!.textContent).toBe('usage'));

    await rerender(
      <>
        <h2 id="usage">Usage</h2>
        <ScrollSpyFixture ids={['usage']} />
      </>,
    );
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(observers).toHaveLength(2);
    expect(observers[1].observe).toHaveBeenCalledTimes(1);

    await unmount();
    expect(observers[1].disconnect).toHaveBeenCalledTimes(1);
  });

  it('returns undefined without constructing an observer for an empty id list', async () => {
    installObserver();
    const { container } = await render(<ScrollSpyFixture ids={[]} />);

    expect(container.querySelector('output')!.textContent).toBe('');
    expect(observers).toHaveLength(0);
  });
});
