import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';

const themes = ['light', 'dark'] as const;

function Example({ onChange }: { onChange?: (value: string) => void }): React.JSX.Element {
  const [active, setActive] = useState('one');
  const change = (value: string): void => {
    setActive(value);
    onChange?.(value);
  };

  return (
    <Tabs active={active} onChange={change}>
      <TabsList aria-label="Example tabs">
        <TabsTrigger value="one" count={2}>
          One
        </TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three">Three</TabsTrigger>
      </TabsList>
      <TabsContent value="one">
        <input aria-label="One input" defaultValue="kept" />
      </TabsContent>
      <TabsContent value="two">Two content</TabsContent>
      <TabsContent value="three">Three content</TabsContent>
    </Tabs>
  );
}

function PillReflowExample({
  direction,
  onChange,
}: {
  direction: 'ltr' | 'rtl';
  onChange?: (value: string) => void;
}): React.JSX.Element {
  const [active, setActive] = useState('open');

  return (
    <Tabs active={active} onChange={onChange ?? setActive} variant="pills">
      <TabsList aria-label="Issue status" dir={direction}>
        <TabsTrigger value="all" count={24000}>
          All workspace issues
        </TabsTrigger>
        <TabsTrigger value="open" count={8000}>
          Issues awaiting investigation
        </TabsTrigger>
        <TabsTrigger value="closed" count={16000}>
          Completed workspace issues
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">All issues</TabsContent>
      <TabsContent value="open">Open issues</TabsContent>
      <TabsContent value="closed">Closed issues</TabsContent>
    </Tabs>
  );
}

// The browser rounds the scrollable range to integers while getBoundingClientRect
// returns fractional values, so allow up to 0.5 CSSpx of scroll quantization
// when measuring the 4px focus inset.
const FOCUS_INSET_CSS_PX = 4;
const SCROLL_QUANTIZATION_TOLERANCE_CSS_PX = 0.5;

async function expectFocusInset(tablist: HTMLElement, destination: HTMLElement): Promise<void> {
  await expect
    .poll(() => {
      const listRect = tablist.getBoundingClientRect();
      const destinationRect = destination.getBoundingClientRect();
      return (
        tablist.scrollWidth > tablist.clientWidth &&
        destinationRect.left >=
          listRect.left + FOCUS_INSET_CSS_PX - SCROLL_QUANTIZATION_TOLERANCE_CSS_PX &&
        destinationRect.right <=
          listRect.right - FOCUS_INSET_CSS_PX + SCROLL_QUANTIZATION_TOLERANCE_CSS_PX
      );
    })
    .toBe(true);
}

function SelfDisablingTrigger(): React.JSX.Element {
  const [disabled, setDisabled] = useState(false);

  return (
    <TabsTrigger value="one" disabled={disabled} onClick={() => setDisabled(true)}>
      One
    </TabsTrigger>
  );
}

type RGB = readonly [number, number, number];

function parseRgb(color: string): RGB {
  const match = color.match(/^rgba?\((.*)\)$/);
  const channels = match?.[1].match(/\d+(?:\.\d+)?/g)?.map(Number);
  if (
    !channels ||
    (channels.length !== 3 && (channels.length !== 4 || channels[3] !== 1)) ||
    channels
      .slice(0, 3)
      .some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)
  ) {
    throw new Error(`Expected a resolved opaque rgb color, received ${color}`);
  }
  return [channels[0], channels[1], channels[2]];
}

function relativeLuminance([red, green, blue]: RGB): number {
  const channels = [red, green, blue].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(parseRgb(foreground));
  const backgroundLuminance = relativeLuminance(parseRgb(background));
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Tabs', () => {
  it('keeps the root callback ref attached during controlled selection', async () => {
    const rootRef = vi.fn<(node: HTMLDivElement | null) => void>();
    function Controlled(): React.JSX.Element {
      const [active, setActive] = useState('one');
      return (
        <Tabs ref={rootRef} active={active} onChange={setActive}>
          <TabsList aria-label="Ref tabs">
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">One content</TabsContent>
          <TabsContent value="two">Two content</TabsContent>
        </Tabs>
      );
    }
    const { container } = await render(<Controlled />);
    const root = container.querySelector<HTMLDivElement>('[data-lyra-tabs]')!;
    expect(rootRef.mock.calls).toEqual([[root]]);
    await userEvent.click(container.querySelector<HTMLButtonElement>('[data-value="two"]')!);
    expect(container.querySelector('[data-value="two"]')!.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(rootRef.mock.calls).toEqual([[root]]);
    await cleanup();
    expect(rootRef.mock.calls).toEqual([[root], [null]]);
  });

  it('renders the dark active line tab at WCAG AA contrast on a card surface at rest and hover', async () => {
    setTheme('dark');
    const { container } = await render(
      <div style={{ background: 'var(--surface-card)' }}>
        <Example />
      </div>,
    );
    const surface = container.querySelector<HTMLElement>('div')!;
    const activeTab = container.querySelector<HTMLElement>('.lyra-tab--active')!;
    const foreground = getComputedStyle(activeTab).color;
    const background = getComputedStyle(surface).backgroundColor;

    expect(foreground).toBe('rgb(165, 167, 238)');
    expect(background).toBe('rgb(18, 20, 48)');
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);

    await userEvent.hover(activeTab);
    activeTab.getAnimations().forEach((animation) => animation.finish());
    const hoverForeground = getComputedStyle(activeTab).color;

    expect(hoverForeground).toBe('rgb(165, 167, 238)');
    expect(contrastRatio(hoverForeground, background)).toBeGreaterThanOrEqual(4.5);

    await userEvent.unhover(activeTab);
    activeTab.getAnimations().forEach((animation) => animation.finish());
  });

  for (const theme of themes)
    it(`keeps its existing classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Tabs active="one" variant="pills" onChange={() => {}}>
            <TabsList aria-label="Example tabs">
              <TabsTrigger value="one" count={2}>
                One
              </TabsTrigger>
            </TabsList>
            <TabsContent value="one">One content</TabsContent>
          </Tabs>,
        );
        expect(container.querySelector('[role=tablist]')!.className).toBe(
          'lyra-tabs lyra-tabs--pills',
        );
        expect(container.querySelector('[role=tab]')!.className).toBe('lyra-tab lyra-tab--active');
        expect(container.querySelector('.lyra-tab__count')!.className).toBe('lyra-tab__count');
        expect(spy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        spy.mockRestore();
      }
    });

  it('owns real mounted panels and preserves their input state across switches', async () => {
    const { container } = await render(<Example />);
    const panels = container.querySelectorAll<HTMLElement>('[role=tabpanel]');
    const input = container.querySelector<HTMLInputElement>('[aria-label="One input"]')!;
    expect(panels).toHaveLength(3);
    expect(panels[0].hidden).toBe(false);
    expect(input.value).toBe('kept');
    await userEvent.click(container.querySelectorAll('[role=tab]')[1]);
    await userEvent.click(container.querySelectorAll('[role=tab]')[0]);
    expect(container.querySelector<HTMLInputElement>('[aria-label="One input"]')).toBe(input);
  });

  for (const width of [343, 288])
    for (const direction of ['ltr', 'rtl'] as const)
      it(`contains long pill tabs at ${width}px in ${direction} and keeps native destinations visible`, async () => {
        const { container } = await render(
          <div data-consumer style={{ width }}>
            <PillReflowExample direction={direction} />
          </div>,
        );
        const consumer = container.querySelector<HTMLElement>('[data-consumer]')!;
        const tablist = container.querySelector<HTMLElement>('[role=tablist]')!;
        const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
        const panels = container.querySelectorAll<HTMLElement>('[role=tabpanel]');
        const arrowStart = direction === 'rtl' ? 2 : 0;

        expect(tablist.getBoundingClientRect().width).toBeLessThanOrEqual(consumer.clientWidth);
        expect(consumer.scrollWidth).toBeLessThanOrEqual(consumer.clientWidth);
        expect(tablist.scrollWidth).toBeGreaterThan(tablist.clientWidth);

        await userEvent.click(tabs[arrowStart]);
        expect(panels[arrowStart].hidden).toBe(false);
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(tabs[1]);
        expect(panels[1].hidden).toBe(false);
        await expectFocusInset(tablist, tabs[1]);

        await userEvent.keyboard('{End}');
        expect(document.activeElement).toBe(tabs[2]);
        expect(panels[2].hidden).toBe(false);
        await expectFocusInset(tablist, tabs[2]);

        await userEvent.keyboard('{Home}');
        expect(document.activeElement).toBe(tabs[0]);
        expect(panels[0].hidden).toBe(false);
        await expectFocusInset(tablist, tabs[0]);
      });

  it('keeps a keyboard-focused pill visible when a controlled change does not commit', async () => {
    const { container } = await render(
      <div data-consumer style={{ width: 343 }}>
        <PillReflowExample direction="ltr" onChange={() => {}} />
      </div>,
    );
    const tablist = container.querySelector<HTMLElement>('[role=tablist]')!;
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    const panels = container.querySelectorAll<HTMLElement>('[role=tabpanel]');

    await userEvent.click(tabs[1]);
    await userEvent.keyboard('{End}');

    expect(document.activeElement).toBe(tabs[2]);
    expect(panels[1].hidden).toBe(false);
    expect(panels[2].hidden).toBe(true);
    await expectFocusInset(tablist, tabs[2]);
  });

  it('roves with automatic activation, wrap, Home and End', async () => {
    const { container } = await render(<Example />);
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    tabs[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tabs[2]);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[0]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('honors trigger and list default prevention without requesting a change', async () => {
    const onChange = vi.fn();
    const { container, rerender } = await render(
      <Tabs active="one" onChange={onChange}>
        <TabsList aria-label="Example tabs">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two" onClick={(event) => event.preventDefault()}>
            Two
          </TabsTrigger>
        </TabsList>
        <TabsContent value="one">One content</TabsContent>
        <TabsContent value="two">Two content</TabsContent>
      </Tabs>,
    );
    await userEvent.click(container.querySelectorAll('[role=tab]')[1]);
    expect(onChange).not.toHaveBeenCalled();
    await rerender(
      <Tabs active="one" onChange={onChange}>
        <TabsList aria-label="Example tabs" onKeyDown={(event) => event.preventDefault()}>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">One content</TabsContent>
        <TabsContent value="two">Two content</TabsContent>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    tabs[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('uses current DOM order, excludes disabled targets, and mirrors RTL arrows', async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Tabs active="one" onChange={onChange}>
        <TabsList aria-label="Example tabs" dir="rtl">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two" disabled>
            Two
          </TabsTrigger>
          <TabsTrigger value="three">Three</TabsTrigger>
        </TabsList>
        <TabsContent value="one">One content</TabsContent>
        <TabsContent value="two">Two content</TabsContent>
        <TabsContent value="three">Three content</TabsContent>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    tabs[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[2]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('three');
  });

  it('excludes CSS-hidden and inherited-disabled triggers from native arrow destinations', async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Tabs active="one" onChange={onChange}>
        <TabsList aria-label="Example tabs">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two" style={{ display: 'none' }}>
            Two
          </TabsTrigger>
          <TabsTrigger value="three" style={{ visibility: 'hidden' }}>
            Three
          </TabsTrigger>
          <fieldset disabled>
            <TabsTrigger value="four">Four</TabsTrigger>
          </fieldset>
          <TabsTrigger value="five">Five</TabsTrigger>
        </TabsList>
        <TabsContent value="one">One content</TabsContent>
        <TabsContent value="two">Two content</TabsContent>
        <TabsContent value="three">Three content</TabsContent>
        <TabsContent value="four">Four content</TabsContent>
        <TabsContent value="five">Five content</TabsContent>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    tabs[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[4]);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('five');
  });

  it('normalizes client entry without selecting an invalid or disabled value', async () => {
    const { container } = await render(
      <Tabs active="missing">
        <TabsList aria-label="Example tabs">
          <TabsTrigger value="one" disabled>
            One
          </TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">One content</TabsContent>
        <TabsContent value="two">Two content</TabsContent>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[0].tabIndex).toBe(-1);
    expect(tabs[1].tabIndex).toBe(0);
  });

  it('normalizes the entry after a child-only disabled update', async () => {
    const { container } = await render(
      <Tabs active="one">
        <TabsList aria-label="Example tabs">
          <SelfDisablingTrigger />
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">One content</TabsContent>
        <TabsContent value="two">Two content</TabsContent>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    await userEvent.click(tabs[0]);
    expect(tabs[0].disabled).toBe(true);
    expect(tabs[1].tabIndex).toBe(0);
  });

  it('repairs focus after repeated paired removals below the root', async () => {
    const onChange = vi.fn();
    let removeNext: (() => void) | undefined;

    function Parts(): React.JSX.Element {
      const [step, setStep] = useState(0);
      useEffect(() => {
        removeNext = () => setStep((current) => current + 1);
      }, []);

      return (
        <>
          <TabsList aria-label="Removable tabs">
            {step < 2 && <TabsTrigger value="one">One</TabsTrigger>}
            {step === 0 && <TabsTrigger value="two">Two</TabsTrigger>}
          </TabsList>
          {step < 2 && <TabsContent value="one">One content</TabsContent>}
          {step === 0 && <TabsContent value="two">Two content</TabsContent>}
        </>
      );
    }

    const { container } = await render(
      <>
        <input aria-label="Before tabs" />
        <Tabs active="one" onChange={onChange}>
          <Parts />
        </Tabs>
      </>,
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    await userEvent.click(container.querySelector<HTMLInputElement>('[aria-label="Before tabs"]')!);
    await userEvent.keyboard('{Tab}{ArrowRight}');
    expect(document.activeElement).toBe(tabs[1]);
    expect(removeNext).toBeTypeOf('function');

    flushSync(removeNext!);
    expect(document.activeElement).toBe(tabs[0]);
    flushSync(removeNext!);
    expect(document.activeElement).toBe(container.querySelector('[role=tablist]'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('two');
  });

  it('does not fabricate controlled selection when the parent ignores a request', async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Tabs active="one" onChange={onChange}>
        <TabsList aria-label="Example tabs">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">One content</TabsContent>
        <TabsContent value="two">Two content</TabsContent>
      </Tabs>,
    );
    await userEvent.click(container.querySelectorAll('[role=tab]')[1]);
    expect(onChange).toHaveBeenCalledWith('two');
    expect(container.querySelectorAll('[role=tab]')[0].getAttribute('aria-selected')).toBe('true');
    expect(container.querySelectorAll<HTMLElement>('[role=tabpanel]')[1].hidden).toBe(true);
  });
});
