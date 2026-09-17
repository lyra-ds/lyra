import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { flushSync } from 'react-dom';
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
    expect(document.activeElement).toBe(options[1]);
    await userEvent.keyboard('{Tab}');
    const create = container.querySelector<HTMLButtonElement>('.lyra-wssw__create')!;
    expect(document.activeElement).toBe(create);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(options[1]);
    await userEvent.keyboard('{Escape}');
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Enter}');
    options = container.querySelectorAll<HTMLButtonElement>('[role=option]');
    await userEvent.click(options[1]);
    expect(onChange).toHaveBeenCalledWith('lyra', workspaces[1]);
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Space}');
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{Tab}');
    await userEvent.click(container.querySelector<HTMLButtonElement>('.lyra-wssw__create')!);
    expect(onCreate).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps Create outside the labelled listbox with one roving workspace tab stop', async () => {
    const { container } = await render(
      <WorkspaceSwitcher workspaces={workspaces} onCreate={() => {}} />,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const listbox = container.querySelector<HTMLElement>('[role=listbox]')!;
    const options = Array.from(listbox.querySelectorAll<HTMLButtonElement>('[role=option]'));
    const create = container.querySelector<HTMLButtonElement>('.lyra-wssw__create')!;

    expect(listbox.getAttribute('aria-labelledby')).toBeTruthy();
    expect(options).toHaveLength(2);
    expect(options.map((option) => option.tabIndex)).toEqual([0, -1]);
    expect(document.activeElement).toBe(options[0]);
    expect(trigger.getAttribute('tabindex')).toBe('0');
    expect(create.getAttribute('tabindex')).toBe('0');
    expect(create.getAttribute('role')).toBeNull();
    expect(create.getAttribute('aria-selected')).toBeNull();
    expect(listbox.contains(create)).toBe(false);

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(options[1]);
    expect(options.map((option) => option.tabIndex)).toEqual([-1, 0]);
  });

  it('activates workspace and create actions once from their native controls', async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn();
    const { container } = await render(
      <WorkspaceSwitcher workspaces={workspaces} onChange={onChange} onCreate={onCreate} />,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('acme', workspaces[0]);

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Space}');
    expect(onCreate).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('keeps native entry and exit behavior for create, no-create, and empty popovers', async () => {
    const { container } = await render(
      <>
        <button type="button" tabIndex={0}>
          Before
        </button>
        <WorkspaceSwitcher workspaces={workspaces} onCreate={() => {}} />
        <button type="button" tabIndex={0}>
          After
        </button>
      </>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
    const after = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'After',
    )!;

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(container.querySelector('.lyra-wssw__create'));
    await userEvent.keyboard('{Tab}');
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(after);

    await userEvent.click(trigger);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await cleanup();
    const empty = await render(<WorkspaceSwitcher workspaces={[]} onCreate={() => {}} />);
    const emptyTrigger = empty.container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
    emptyTrigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(empty.container.querySelector('.lyra-wssw__create'));
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(empty.container.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(emptyTrigger);

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(empty.container.querySelector('.lyra-wssw__create'));
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(emptyTrigger);

    await cleanup();
    const noCreate = await render(<WorkspaceSwitcher workspaces={workspaces} />);
    const noCreateTrigger =
      noCreate.container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
    noCreateTrigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Tab}');
    expect(noCreate.container.querySelector('[role=listbox]')).toBeNull();
  });

  it('keeps focus on the trigger when an entirely empty popover opens and closes', async () => {
    const { container } = await render(<WorkspaceSwitcher workspaces={[]} />);
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard('{Escape}');
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps one valid roving option when workspaces reorder', async () => {
    const { container, rerender } = await render(
      <WorkspaceSwitcher workspaces={workspaces} current="acme" />,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const originalOptions = container.querySelectorAll<HTMLButtonElement>('[role=option]');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(originalOptions[1]);
    expect(Array.from(originalOptions, (option) => option.tabIndex)).toEqual([-1, 0]);

    await rerender(
      <WorkspaceSwitcher workspaces={[workspaces[1], workspaces[0]]} current="lyra" defaultOpen />,
    );

    const reorderedOptions = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role=option]'),
    );
    expect(reorderedOptions[0]).toBe(originalOptions[1]);
    expect(document.activeElement).toBe(reorderedOptions[0]);
    expect(reorderedOptions.map((option) => option.tabIndex)).toEqual([0, -1]);
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
      expect(options).toHaveLength(3);
      expect(Array.from(options, (option) => option.getAttribute('aria-selected'))).toEqual([
        'false',
        'true',
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

  it('lets the root cancel keyboard defaults before opening, navigation, and dismissal', async () => {
    const workspacesWithSelectedMiddle = [
      { id: 'alpha', name: 'Alpha' },
      { id: 'beta', name: 'Beta' },
      { id: 'gamma', name: 'Gamma' },
    ];
    const onChange = vi.fn();
    const onCreate = vi.fn();
    let cancelDefaults = true;
    let root: HTMLDivElement | null = null;
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLDivElement>) => {
      expect(event.currentTarget).toBe(root);
      expect(event.target).not.toBe(root);
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(event.target);
      if (cancelDefaults) event.preventDefault();
    });
    const { container } = await render(
      <WorkspaceSwitcher
        workspaces={workspacesWithSelectedMiddle}
        current="beta"
        onChange={onChange}
        onCreate={onCreate}
        onKeyDown={onKeyDown}
      />,
    );
    root = container.querySelector<HTMLDivElement>('.lyra-wssw')!;
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;

    for (const key of ['{Enter}', '{Space}', '{ArrowDown}', '{ArrowUp}'] as const) {
      trigger.focus();
      await userEvent.keyboard(key);
      expect(container.querySelector('[role=listbox]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    }

    await userEvent.click(trigger);
    const selected = container.querySelector<HTMLButtonElement>(
      '[role=option][aria-selected="true"]',
    )!;
    expect(document.activeElement).toBe(selected);
    for (const key of [
      '{ArrowDown}',
      '{ArrowUp}',
      '{Home}',
      '{End}',
      '{Escape}',
      '{Tab}',
    ] as const) {
      await userEvent.keyboard(key);
      expect(container.querySelector('[role=listbox]')).not.toBeNull();
      expect(document.activeElement).toBe(selected);
    }

    cancelDefaults = false;
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(
      container.querySelector<HTMLButtonElement>('[role=option]:last-of-type'),
    );
    await userEvent.keyboard('{Tab}');
    const create = container.querySelector<HTMLButtonElement>('.lyra-wssw__create')!;
    expect(document.activeElement).toBe(create);
    cancelDefaults = true;
    await userEvent.keyboard('{Space}');
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    expect(document.activeElement).toBe(create);

    expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual([
      'Enter',
      ' ',
      'ArrowDown',
      'ArrowUp',
      'ArrowDown',
      'ArrowUp',
      'Home',
      'End',
      'Escape',
      'Tab',
      'End',
      'Tab',
      ' ',
    ]);
    expect(onChange).not.toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('keeps keyboard defaults when the root only stops propagation', async () => {
    const onAncestorKeyDown = vi.fn();
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLDivElement>) => event.stopPropagation());
    const { container } = await render(
      <div role="presentation" onKeyDown={onAncestorKeyDown}>
        <WorkspaceSwitcher workspaces={workspaces} onKeyDown={onKeyDown} />
      </div>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onAncestorKeyDown).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      container.querySelector<HTMLButtonElement>('[role=option][aria-selected="true"]'),
    );
  });

  it('lets the root cancel native trigger, workspace, and create clicks before their defaults', async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn();
    const events: MouseEvent<HTMLDivElement>[] = [];
    let cancelDefaults = true;
    let root: HTMLDivElement | null = null;
    const { container } = await render(
      <WorkspaceSwitcher
        workspaces={workspaces}
        onChange={onChange}
        onCreate={onCreate}
        onClick={(event) => {
          events.push(event);
          expect(event.currentTarget).toBe(root);
          expect(event.target).not.toBe(root);
          expect(event.defaultPrevented).toBe(false);
          if (cancelDefaults) event.preventDefault();
        }}
      />,
    );
    root = container.querySelector<HTMLDivElement>('.lyra-wssw')!;
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;

    await userEvent.click(trigger);
    expect(container.querySelector('[role=listbox]')).toBeNull();
    cancelDefaults = false;
    await userEvent.click(trigger);
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    cancelDefaults = true;
    await userEvent.click(trigger);
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    const workspace = container.querySelectorAll<HTMLButtonElement>('[role=option]')[1]!;
    const create = container.querySelector<HTMLButtonElement>('.lyra-wssw__create')!;
    await userEvent.click(workspace);
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    await userEvent.click(create);
    expect(onCreate).not.toHaveBeenCalled();
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(workspace);
    await userEvent.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(create);
    await userEvent.keyboard('{Space}');
    expect(onCreate).not.toHaveBeenCalled();
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    expect(events).toHaveLength(7);
  });

  it('honors descendant click cancellation and preserves defaults when the root stops propagation', async () => {
    const onChange = vi.fn();
    const onOuterClick = vi.fn();
    const onClick = vi.fn((event: MouseEvent<HTMLDivElement>) => event.stopPropagation());
    const { container } = await render(
      <div role="presentation" onClick={onOuterClick}>
        <WorkspaceSwitcher
          defaultOpen
          workspaces={workspaces}
          onChange={onChange}
          onClick={onClick}
        />
      </div>,
    );
    const workspace = container.querySelectorAll<HTMLButtonElement>('[role=option]')[1]!;
    workspace.addEventListener('click', (event) => event.preventDefault(), { once: true });

    await userEvent.click(workspace);
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('[role=listbox]')).not.toBeNull();
    expect(onClick).toHaveBeenCalledOnce();
    expect(onOuterClick).not.toHaveBeenCalled();

    await userEvent.click(workspace);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('lyra', workspaces[1]);
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onOuterClick).not.toHaveBeenCalled();
  });

  it('keeps the clicked workspace stable when the root synchronously reorders workspaces', async () => {
    const onChange = vi.fn();
    function Example() {
      const [items, setItems] = useState(workspaces);
      return (
        <WorkspaceSwitcher
          defaultOpen
          workspaces={items}
          onChange={onChange}
          onClick={() => flushSync(() => setItems((current) => [...current].reverse()))}
        />
      );
    }

    const { container } = await render(<Example />);
    await userEvent.click(container.querySelectorAll<HTMLButtonElement>('[role=option]')[1]!);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('lyra', workspaces[1]);
    expect(container.querySelector('[role=listbox]')).toBeNull();
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
