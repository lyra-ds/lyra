import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { WorkspaceSwitcher } from './index';

const workspaces = [
  { id: 'acme', name: 'Acme', plan: 'Pro', members: 5 },
  { id: 'lyra', name: 'Lyra', plan: 'Free', members: 2 },
];

const themes = ['light', 'dark'] as const;

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

describe('WorkspaceSwitcher', () => {
  for (const theme of themes) {
    it(`emits exact classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <WorkspaceSwitcher workspaces={workspaces} onCreate={() => {}} defaultOpen />,
        );
        const root = container.querySelector<HTMLElement>('.lyra-wssw')!;
        expect(root.className).toBe('lyra-wssw');
        expect(root.querySelector('.lyra-wssw__trigger')!.className).toBe('lyra-wssw__trigger');
        expect(root.querySelector('.lyra-wssw__id')!.className).toBe('lyra-wssw__id');
        expect(root.querySelector('.lyra-wssw__name')!.className).toBe('lyra-wssw__name');
        expect(root.querySelector('.lyra-wssw__plan')!.className).toBe('lyra-wssw__plan');
        expect(root.querySelector('.lyra-wssw__pop')!.className).toBe('lyra-wssw__pop');
        expect(root.querySelector('.lyra-wssw__pop-label')!.className).toBe('lyra-wssw__pop-label');
        expect(root.querySelector('.lyra-wssw__item')!.className).toBe('lyra-wssw__item');
        expect(root.querySelector('.lyra-wssw__meta')!.className).toBe('lyra-wssw__meta');
        expect(root.querySelector('.lyra-wssw__sep')!.className).toBe('lyra-wssw__sep');
        expect(root.querySelector('.lyra-wssw__create')!.className).toBe(
          'lyra-wssw__item lyra-wssw__create',
        );
        expect(root.querySelector('.lyra-wssw__plus')!.className).toBe('lyra-wssw__plus');
        expect(root.querySelector('.lyra-wssw__create-label')!.className).toBe(
          'lyra-wssw__create-label',
        );
        await expectNoAxeViolations(container);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });

    it(`keeps selected and unselected metadata at WCAG AA contrast at rest, hover, and keyboard focus in ${theme}`, async () => {
      setTheme(theme);
      expect(document.documentElement.getAttribute('data-theme')).toBe(
        theme === 'dark' ? 'dark' : null,
      );

      const { container } = await render(
        <WorkspaceSwitcher workspaces={workspaces} onCreate={() => {}} defaultOpen />,
      );
      const popover = container.querySelector<HTMLElement>('.lyra-wssw__pop')!;
      const popoverBackground = getComputedStyle(popover).backgroundColor;
      expect(popoverBackground).toBe(theme === 'dark' ? 'rgb(18, 20, 48)' : 'rgb(255, 255, 255)');

      const workspaceOptions = Array.from(
        container.querySelectorAll<HTMLButtonElement>('[role=option]'),
      ).filter((option) => option.querySelector('.lyra-wssw__meta') != null);
      expect(workspaceOptions).toHaveLength(2);
      expect(workspaceOptions.map((option) => option.getAttribute('aria-selected'))).toEqual([
        'true',
        'false',
      ]);

      for (const option of workspaceOptions) {
        const metadata = option.querySelector<HTMLElement>('.lyra-wssw__meta')!;
        expect(
          contrastRatio(getComputedStyle(metadata).color, popoverBackground),
        ).toBeGreaterThanOrEqual(4.5);
        await expectNoAxeViolations(container);
      }

      for (const option of workspaceOptions) {
        await userEvent.hover(option);
        expect(option.matches(':hover')).toBe(true);
        const metadata = option.querySelector<HTMLElement>('.lyra-wssw__meta')!;
        const hoverBackground = getComputedStyle(option).backgroundColor;
        expect(
          contrastRatio(getComputedStyle(metadata).color, hoverBackground),
        ).toBeGreaterThanOrEqual(4.5);
        await expectNoAxeViolations(container);
        await userEvent.unhover(option);
      }

      const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
      trigger.focus();
      for (const option of workspaceOptions) {
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(option);
        const metadata = option.querySelector<HTMLElement>('.lyra-wssw__meta')!;
        expect(
          contrastRatio(getComputedStyle(metadata).color, popoverBackground),
        ).toBeGreaterThanOrEqual(4.5);
        await expectNoAxeViolations(container);
      }
    });
  }

  it('opens, roves real focus, escapes, selects, and creates from the popover', async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn();
    const { container } = await render(
      <WorkspaceSwitcher workspaces={workspaces} onChange={onChange} onCreate={onCreate} />,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    let options = container.querySelectorAll<HTMLButtonElement>('[role=option]');
    expect(document.activeElement).toBe(options[0]);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(options[1]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(options[0]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(options[2]);
    await userEvent.keyboard('{Escape}');
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Enter}');
    options = container.querySelectorAll<HTMLButtonElement>('[role=option]');
    await userEvent.click(options[1]);
    expect(onChange).toHaveBeenCalledWith('lyra', workspaces[1]);
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Space}');
    const create = container.querySelector<HTMLButtonElement>('.lyra-wssw__create')!;
    await userEvent.click(create);
    expect(onCreate).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
  });

  it('opens to the selected middle workspace with Enter, Space, and both arrows', async () => {
    const workspacesWithSelectedMiddle = [
      { id: 'alpha', name: 'Alpha', plan: 'Pro', members: 3 },
      { id: 'beta', name: 'Beta', plan: 'Team', members: 7 },
      { id: 'gamma', name: 'Gamma', plan: 'Free', members: 1 },
    ];
    const onChange = vi.fn();
    const onCreate = vi.fn();
    const { container } = await render(
      <WorkspaceSwitcher
        workspaces={workspacesWithSelectedMiddle}
        current="beta"
        onChange={onChange}
        onCreate={onCreate}
      />,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;

    for (const key of ['{Enter}', '{Space}', '{ArrowDown}', '{ArrowUp}'] as const) {
      trigger.focus();
      await userEvent.keyboard(key);
      const options = container.querySelectorAll<HTMLButtonElement>('[role=option]');
      expect(options).toHaveLength(4);
      expect(Array.from(options, (option) => option.getAttribute('aria-selected'))).toEqual([
        'false',
        'true',
        'false',
        'false',
      ]);
      const selectedOption = container.querySelector<HTMLButtonElement>(
        '[role=option][aria-selected="true"]',
      )!;
      expect(selectedOption.querySelector('.lyra-wssw__name')!.textContent).toBe('Beta');
      expect(document.activeElement).toBe(selectedOption);
      expect(onChange).not.toHaveBeenCalled();
      expect(onCreate).not.toHaveBeenCalled();
      await userEvent.keyboard('{Escape}');
      expect(container.querySelector('[role=listbox]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('flips the popover above the trigger instead of scrolling the page when there is no room below', async () => {
    const { container } = await render(
      <>
        <div style={{ height: 'calc(100vh - 80px)' }} />
        <WorkspaceSwitcher workspaces={workspaces} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
    const scrollBefore = window.scrollY;
    await userEvent.click(trigger);
    expect(container.querySelector('.lyra-wssw__pop')!.className).toContain('lyra-wssw__pop--up');
    expect(window.scrollY).toBe(scrollBefore);
  });

  it('keeps the popover below the trigger when it fits', async () => {
    const { container } = await render(
      <>
        <WorkspaceSwitcher workspaces={workspaces} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    await userEvent.click(container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!);
    expect(container.querySelector('.lyra-wssw__pop')!.className).not.toContain(
      'lyra-wssw__pop--up',
    );
  });
});
